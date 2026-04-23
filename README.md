# ProofTag - QR/Barcode Scanner & Verification App

A full-stack application for scanning QR codes and barcodes to verify products against a database.

## Features

- **Camera Scanner**: Scan QR codes and barcodes using your device camera
- **Manual Entry**: Enter a barcode manually if camera scanning is unavailable
- **Product Verification**: Real-time verification against a MySQL database
- **Scan History**: Track all scans with timestamps and results
- **Admin Panel**: Manage products (Create, Read, Update, Delete)
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend

- Node.js + Express
- Prisma ORM
- MySQL Database
- CORS enabled for frontend communication

### Frontend

- React + Vite
- React Router for navigation
- Axios for API calls
- Backend image processing with zbar-tools for QR/barcode scanning

## Project Structure

```
prooftTag/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   ├── seed.js                # Seed data
│   │   └── migrations/            # Database migrations
│   ├── src/
│   │   ├── controllers/           # Request controllers
│   │   ├── routes/                # API routes
│   │   ├── services/              # Business logic & barcode processing
│   │   ├── middleware/            # Express middleware
│   │   ├── utils/                 # Utilities (Prisma client)
│   │   └── server.js              # Express server
│   ├── .env                       # Environment variables
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Scanner/           # Scanner components
    │   │   └── Layout/            # Layout components
    │   ├── pages/                 # Main pages
    │   ├── services/              # API service
    │   └── App.jsx                # Main app component
    ├── vite.config.js             # Vite configuration
    └── package.json
```

## Installation

### Prerequisites

- Node.js (v16 or newer)
- MySQL database
- npm or yarn
- zbar-tools for barcode scanning (Ubuntu/Debian: `sudo apt-get install zbar-tools`)

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:
   - Edit the `.env` file with your database credentials
   - Default: `DATABASE_URL="mysql://<username>:<password>@<host>:<port>/<database>"`

4. Run database migrations:

   ```bash
   npm run prisma:migrate
   ```

5. Seed the database with initial data:

   ```bash
   npm run prisma:seed
   ```

6. Start the backend server:

   ```bash
   npm run dev
   ```

   Backend will run at: http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

   Frontend will run at: http://localhost:5174

## Usage

### Scanner Page

1. Go to http://localhost:5174
2. Choose between "Camera Scan" or "Manual Entry"
3. **Camera Mode**:
   - Click "Start Scanner" and point at a QR code or barcode
   - The system automatically captures an image every 2 seconds
   - The image is sent to the backend to be processed using zbar-tools
   - Up to 10 detection attempts before stopping automatically
   - A real-time counter shows attempt count (1/10, 2/10, etc.)
4. **Manual Mode**: Enter the barcode number and click "Verify Barcode"
5. View verification results instantly via toast notifications

### History Page

1. Go to http://localhost:5174/history
2. View all previous scans with:
   - Date and time
   - Barcode number
   - Verification status (Found/Not Found)
   - Product details (if found)

### Admin Page

1. Go to http://localhost:5174/admin
2. **Add Product**: Click the "+ Add Product" button
   - Enter Barcode (required)
   - Enter Product Name (required)
   - Enter Unit/Measure (optional, e.g., ITEM, PACK, KG)
   - Enter Rating (optional, 1-5 stars)
3. **Edit Product**: Click "Edit" on the product row
4. **Delete Product**: Click "Delete" (with confirmation)

## API Endpoints

### Products

- `GET /api/products/verify/:barcode` - Verify a product by barcode
- `GET /api/products` - Get all products
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product
- `GET /api/products/search?q=query` - Search products

### Barcode Scanning

- `POST /api/barcode/scan-image` - Upload an image for barcode scanning
  - Accepts: multipart/form-data with field 'image'
  - Processes: Uses zbarimg to detect barcodes
  - Returns: Barcode result or an error if not found

### Scans

- `GET /api/scans/history?limit=50` - Get scan history
- `GET /api/scans/stats` - Get scan statistics
- `POST /api/scans` - Record a manual scan

### Health Check

- `GET /api/health` - Server health check

## Sample Data

Seed data includes:

1. **Barcode**: 6281006703841
   - **Product**: LIPTON GREEN TEA 1X150G 100S CLASSIC GREEN TEA
   - **Measure**: ITEM
   - **Rating**: 1 star

2. **Barcode**: 8996001326220
   - **Product**: KISS Mint Cherry
   - **Measure**: ITEM
   - **Rating**: 5 stars

## Database Schema

### Product Table

| Field       | Type     | Description                  |
| ----------- | -------- | ---------------------------- |
| id          | Int      | Primary key (auto-increment) |
| barcode     | String   | Unique barcode identifier    |
| productName | String   | Product name                 |
| measure     | String   | Unit of measure (optional)   |
| rating      | Int      | Rating 1-5 (optional)        |
| createdAt   | DateTime | Created timestamp            |
| updatedAt   | DateTime | Last updated timestamp       |

### ScanHistory Table

| Field     | Type     | Description                       |
| --------- | -------- | --------------------------------- |
| id        | Int      | Primary key (auto-increment)      |
| barcode   | String   | Scanned barcode                   |
| found     | Boolean  | Whether the product was found     |
| productId | Int      | Foreign key to Product (nullable) |
| scannedAt | DateTime | Scan timestamp                    |

## Camera Permissions

### For HTTPS Deployment

- Camera access requires HTTPS in production
- Development uses localhost (allowed via HTTP)
- For mobile testing, use ngrok or a similar tunneling service

### Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari (iOS): Requires iOS 11+ and HTTPS
- Camera permission must be granted by the user

## Troubleshooting

### Backend Issues

1. **Database connection error**:
   - Verify MySQL is running
   - Check DATABASE_URL in `.env`
   - Make sure the `proofTag` database exists

2. **Port already in use**:
   - Change PORT in `.env`
   - Kill the process using port 5000: `lsof -ti:5000 | xargs kill`

3. **zbarimg not found**:
   - Install zbar-tools: `sudo apt-get install zbar-tools`
   - Verify installation: `which zbarimg`

### Frontend Issues

1. **Camera not working**:
   - Ensure you're using HTTPS (or localhost)
   - Check browser permissions
   - Use manual entry as an alternative
   - Hard refresh the browser (Ctrl+Shift+R) to load the latest code

2. **API error**:
   - Verify backend is running on port 5000
   - Check the browser console for CORS errors
   - Ensure the proxy is configured in `vite.config.js`

3. **Scanner doesn’t stop after 10 attempts**:
   - Do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Clear browser cache
   - Restart the frontend development server

### Barcode Detection Issues

1. **Barcode not detected**:
   - Make sure the barcode is in focus and lighting is good
   - Keep a distance of 15-25cm from the camera
   - Hold the camera steady when "Analyzing..." appears
   - Use Manual Entry for guaranteed results
   - EAN/UPC barcodes are supported, QR codes are also supported

## Development Commands

### Backend

```bash
npm run dev           # Run dev server with nodemon
npm start             # Run production server
npm run prisma:migrate # Run database migrations
npm run prisma:seed   # Seed the database with initial data
npm run prisma:studio # Open Prisma Studio (database GUI)
```

### Frontend

```bash
npm run dev     # Run Vite dev server
npm run build   # Build for production
npm run preview # Preview the production build
```

## Production Deployment

### Backend

1. Set `NODE_ENV=production` in the environment
2. Use a process manager (PM2, systemd)
3. Configure the correct DATABASE_URL for production
4. Set up a reverse proxy (nginx)
5. Enable SSL/TLS
6. Ensure zbar-tools is installed on the production server

### Frontend

1. Build the app: `npm run build`
2. Deploy the `dist/` folder to static hosting
3. Configure the API URL based on the environment
4. Ensure HTTPS for camera access

## Scanning Key Features

### Backend Image Processing

- Frames are captured from the frontend camera every 2 seconds
- Sent to the backend via multipart/form-data
- Processed using the `zbarimg` CLI tool with the `-S*.enable` flag
- Supports all EAN/UPC barcode types and QR codes
- Temporary files are cleaned up automatically after processing

### Auto-Stop Scanner

- Scanner stops automatically after 10 failed attempts
- Real-time counter shows progress (1/10, 2/10, etc.)
- Visual warning colors:
  - Yellow: 0-6 attempts
  - Red: 7-10 attempts
- Button changes to "Start Scanner Again" after auto-stop

### Toast Notifications

- Loading state while verifying
- Success with product details
- Error if barcode is not found
- Auto-close the camera after a successful scan

## System Architecture

```
Frontend (React)
    ↓ Capture frame every 2 seconds
    ↓ Convert to JPEG blob
    ↓ POST multipart/form-data
Backend (Express)
    ↓ Receive via Multer
    ↓ Save to temp file
    ↓ Execute zbarimg CLI
    ↓ Parse output
    ↓ Cleanup temp file
    ↓ Query database if barcode is found
    ↓ Return result
Frontend
    ↓ Display toast notification
    ↓ Auto-stop camera on success
```

## License

ISC

## Support

For issues or questions, please contact the development team.
