# ベースイメージ
FROM node:18

# 作業ディレクトリ
WORKDIR /app

# パッケージインストール
COPY package*.json ./
RUN npm install

# アプリケーションのコードをコピー
COPY . .

# ビルド
RUN npm run build

# ポート設定
EXPOSE 3000

# アプリケーション実行
CMD ["npm", "run", "start:prod"]