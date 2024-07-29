import zstandard as zstd
import json, time
from pymongo import MongoClient, errors

client = MongoClient("mongodb://127.0.0.1:27017/")
db = client['next-auth']
collection = db['static-data']


with open("partner_feed_en_v3.jsonl.zst", "rb") as fh:
    dctx = zstd.ZstdDecompressor(max_window_size=2147483648)
    with dctx.stream_reader(fh) as reader:
        previous_line, chunk_count = "", 0
        while True:
            print(chunk_count)
            chunk = reader.read(2**26)  # 64MB chunks
            if not chunk:
                break

            string_data = chunk.decode('utf-8')
            lines = string_data.split("\n")
            for i, line in enumerate(lines[:-1]):
                if i == 0:
                    line = previous_line + line
                object = json.loads(line)
                collection.insert_one(object)
            previous_line = lines[-1]
            chunk_count += 1
