# EcoScan

A modern web application for analyzing product environmental and nutritional impact through barcode scanning and image recognition.

## Features

- **Image Upload**: Upload product images to detect barcodes automatically using OCR
- **Manual Barcode Entry**: Enter product barcodes manually for quick lookup
- **Product Analysis**: Get detailed nutritional and environmental impact analysis
- **OpenFoodFacts Integration**: Fetch comprehensive product data from the world's largest food database
- **Responsive Design**: Clean, modern interface that works on all devices

## Tech Stack

### Backend
- **Node.js** with Express.js
- **Tesseract.js** for OCR barcode detection
- **Multer** for file upload handling
- **Axios** for API requests to OpenFoodFacts

### Frontend
- **React** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** components for accessibility
- **Sonner** for toast notifications

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ecoscan
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```
The API will be available at `http://localhost:3001`

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```
The application will be available at `http://localhost:5174`

## API Endpoints

### Upload Image
- **POST** `/api/upload`
- Upload an image file to detect barcode using OCR
- Returns detected barcode or error message

### Get Product by Barcode
- **GET** `/api/product/:barcode`
- Fetch product information from OpenFoodFacts database
- Returns formatted product data

### Analyze Product
- **POST** `/api/product/analyze`
- Analyze product data and generate detailed report
- Returns formatted analysis text with recommendations

## Project Structure

```
ecoscan/
├── backend/
│   ├── controllers/
│   │   ├── productController.js
│   │   └── uploadController.js
│   ├── routes/
│   │   ├── productRoutes.js
│   │   └── uploadRoutes.js
│   ├── uploads/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── AnalysisCard.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   └── UploadForm.tsx
│   │   ├── pages/
│   │   │   └── Index.tsx
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.