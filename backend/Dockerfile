FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt


# Copy the rest of your application code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "parser:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]