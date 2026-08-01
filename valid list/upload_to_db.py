import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import os

excel_file = "combined_candidates.xlsx"
db_url = "postgresql://neondb_owner:npg_WsSQNa1hU4bA@ep-young-resonance-awxu7v1d-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require"

print(f"Reading {excel_file}...")
df = pd.read_excel(excel_file)
print(f"Loaded {len(df)} candidate rows.")

print("Connecting to Neon PostgreSQL...")
conn = psycopg2.connect(db_url)
cursor = conn.cursor()
print("Dropping and recreating tables...")

drop_candidates_table = "DROP TABLE IF EXISTS candidates;"
drop_visits_table = "DROP TABLE IF EXISTS site_visits;"

create_candidates_table = """
CREATE TABLE candidates (
    roll INT PRIMARY KEY,
    payment_id VARCHAR(50),
    name VARCHAR(255),
    father_name VARCHAR(255),
    quota VARCHAR(100),
    comment TEXT,
    department VARCHAR(255),
    source_file VARCHAR(255),
    date VARCHAR(20),
    shift_with_time VARCHAR(100),
    building_name VARCHAR(255),
    room VARCHAR(100),
    selected BOOLEAN DEFAULT FALSE,
    waiting_list BOOLEAN DEFAULT FALSE
);
"""

create_visits_table = """
CREATE TABLE site_visits (
    id SERIAL PRIMARY KEY,
    path VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address VARCHAR(100)
);
"""

# Execute drop first
cursor.execute(drop_candidates_table)
cursor.execute(drop_visits_table)

# Then create fresh tables
cursor.execute(create_candidates_table)
cursor.execute(create_visits_table)

conn.commit()
print("Tables dropped and recreated successfully.")

# 2. Upload candidates data in batches using fast execute_values
print("Inserting candidate data using fast execute_values...")
insert_query = """
INSERT INTO candidates (
    roll, payment_id, name, father_name, quota, comment, department, 
    source_file, date, shift_with_time, building_name, room, selected, waiting_list
) VALUES %s
ON CONFLICT (roll) DO UPDATE SET
    payment_id = EXCLUDED.payment_id,
    name = EXCLUDED.name,
    father_name = EXCLUDED.father_name,
    quota = EXCLUDED.quota,
    comment = EXCLUDED.comment,
    department = EXCLUDED.department,
    source_file = EXCLUDED.source_file,
    date = EXCLUDED.date,
    shift_with_time = EXCLUDED.shift_with_time,
    building_name = EXCLUDED.building_name,
    room = EXCLUDED.room,
    selected = EXCLUDED.selected,
    waiting_list = EXCLUDED.waiting_list;
"""

batch = []
for idx, row in df.iterrows():
    roll = int(row["Applicant's ID"])
    payment_id = str(row["Payment ID"]).strip()
    name = str(row["Name"]).strip()
    father_name = str(row["Father's Name"]).strip()
    quota = str(row["Quota"]).strip() if pd.notna(row["Quota"]) else ""
    comment = str(row["Comment"]).strip() if pd.notna(row["Comment"]) else ""
    department = str(row["Department"]).strip()
    source_file = str(row["Source File"]).strip()
    date = str(row["Date"]).strip()
    shift_with_time = str(row["Shift with Time"]).strip()
    building_name = str(row["Building Name"]).strip()
    room = str(row["Room"]).strip()
    selected = bool(row["Selected"])
    waiting_list = bool(row["Waiting List"])
    
    batch.append((
        roll, payment_id, name, father_name, quota, comment, department,
        source_file, date, shift_with_time, building_name, room, selected, waiting_list
    ))

# Execute single bulk fast transaction
execute_values(cursor, insert_query, batch)
conn.commit()

print(f"Fast upload completed successfully. Uploaded {len(batch)} records to database.")

cursor.close()
conn.close()
