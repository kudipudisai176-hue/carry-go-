# CarryGo Backend Setup Guide

This is the backend for the CarryGo platform, built with Node.js, Express, and MongoDB.

## Features implemented:
- **Authentication**: `POST /api/auth/register`, `POST /api/auth/login`
- **Parcel Management**: `POST /api/parcel/create`, `POST /api/parcel/accept`
- **Delivery Flow**: `POST /api/parcel/pickup` (OTP + Photo), `POST /api/parcel/deliver` (OTP + Photo), `POST /api/parcel/release-payment`
- **Travel Plans**: `POST /api/travel/add`, `GET /api/travel/active`
- **Tracking**: `GET /api/parcel/track/:id`

## Prerequisites
- Node.js (v14+)
- MongoDB (Local OR Atlas)

## Step-by-Step Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**:
   Edit the `.env` file in the `backend` folder:
   - `MONGODB_URI`: Your MongoDB connection string (default is local).
   - `JWT_SECRET`: A secret key for tokens.
   - `PORT`: Server port (default is 5000).

3. **Run the Server**:
   ```bash
   npm run dev
   ```
   (I've added `nodemon` for auto-restarts during development).

4. **API Testing**:
   You can use Postman or `curl` to test the endpoints. The server runs at `http://localhost:5000/api`.

## Flow Overview
1. **Sender** posts a parcel.
2. **Traveller** accepts the parcel.
3. **Traveller** picks up the parcel (requires OTP from Sender + Photo Upload).
4. **Traveller** delivers the parcel (requires OTP from Receiver + Photo Upload).
5. **Sender/Admin** releases payment after confirmation.
