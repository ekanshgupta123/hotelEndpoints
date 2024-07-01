import os
import json
import time
from pymongo import MongoClient, errors

def split_and_upload_jsonl_to_mongodb(input_file, db_name, collection_name, max_chunk_size, mongo_uri="mongodb://localhost:27017/", max_retries=5, checkpoint_file="checkpoint.txt"):
    # Connect to MongoDB
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        collection = db[collection_name]
        client.admin.command('ping')  # Test connection
    except errors.ConnectionFailure as e:
        print(f"Could not connect to MongoDB: {e}")
        return

    # Clear the MongoDB collection if needed
    confirmation = input(f"Do you want to clear the collection '{collection_name}' in database '{db_name}'? Type 'yes' to confirm: ")
    if confirmation.lower() == 'yes':
        collection.delete_many({})
        print(f"Cleared the collection '{collection_name}'.")

    # Delete the checkpoint file if it exists
    if os.path.exists(checkpoint_file):
        os.remove(checkpoint_file)
        print(f"Deleted checkpoint file '{checkpoint_file}'.")

    current_chunk = []
    current_chunk_size = 0
    file_count = 0

    def upload_chunk(chunk, retries=0):
        try:
            collection.insert_many(chunk)
            print(f"Uploaded chunk {file_count} to MongoDB")
        except errors.BulkWriteError as e:
            print(f"Error writing chunk {file_count} to MongoDB: {e}")
        except errors.AutoReconnect as e:
            if retries < max_retries:
                print(f"AutoReconnect error: {e}. Retrying...")
                time.sleep(2 ** retries)  # Exponential backoff
                upload_chunk(chunk, retries + 1)
            else:
                print(f"Failed to write chunk {file_count} to MongoDB after {max_retries} retries: {e}")

    try:
        with open(input_file, 'r') as infile:
            while True:
                line = infile.readline()
                if not line:
                    break

                line_size = len(line.encode('utf-8'))

                if current_chunk_size + line_size > max_chunk_size:
                    # Upload the current chunk to MongoDB
                    if current_chunk:
                        upload_chunk(current_chunk)
                    
                    # Reset for the next chunk
                    file_count += 1
                    current_chunk = []
                    current_chunk_size = 0

                # Add the line to the current chunk
                json_data = json.loads(line)
                current_chunk.append(json_data)
                current_chunk_size += line_size
            
            # Upload the remaining data in the last chunk
            if current_chunk:
                upload_chunk(current_chunk)

    except FileNotFoundError as e:
        print(f"File not found: {e}")
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
    finally:
        client.close()

# Usage
input_file = '/Users/ekanshgupta/Downloads/partner_feed_en_v3.jsonl'
db_name = 'next-auth'
collection_name = 'static-hotel-data'
max_chunk_size = 100 * 1024 * 1024  # 100MB in bytes

split_and_upload_jsonl_to_mongodb(input_file, db_name, collection_name, max_chunk_size)
