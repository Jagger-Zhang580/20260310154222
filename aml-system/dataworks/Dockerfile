FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir \
    psycopg2-binary \
    minio \
    schedule \
    requests \
    faker

COPY . /app

CMD ["python", "scheduler.py"]
