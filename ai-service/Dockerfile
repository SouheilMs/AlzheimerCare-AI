FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --default-timeout=1000 --retries 10 --no-deps torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir --default-timeout=1000 --retries 10 -i https://pypi.tuna.tsinghua.edu.cn/simple filelock typing-extensions sympy networkx jinja2 fsspec setuptools
RUN pip install --no-cache-dir --default-timeout=1000 --retries 10 -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
COPY . .