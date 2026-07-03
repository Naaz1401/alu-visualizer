# 🖥️ ALU Visualizer

An interactive web-based simulator designed to visualize the inner workings of an **Arithmetic Logic Unit (ALU)**. This tool makes computer architecture intuitive by breaking down how data routes through logic gates and multiplexers to execute mathematical and logic operations.

🚀 **[View Live Demo](https://naaz1401.github.io/alu-visualizer/)**

---

## ✨ Features

* **Interactive Control Unit:** Modify inputs, opcodes, and control signals manually to see instant state changes.
* **Real-time Path Highlighting:** Watch active data paths and signals light up as signals travel through the hardware blocks.
* **Dynamic Arithmetic Operations:** Supports tracking of basic computations like Addition (ADD), Subtraction (SUB), and more.
* **Logic Operations Explorer:** Inspect bitwise functions such as AND, OR, XOR, and NOT logic gates in action.
* **Hardware Flag Outputs:** Instant visibility into standard CPU status flags like **Zero (Z)**, **Carry (C)**, **Sign/Negative (S)**, and **Overflow (V)**.

---

## 🛠️ Built With

This application leverages modern web tools for speed, structural type-safety, and interactive front-end performance:

* [Vite](https://vite.dev) - Next-generation frontend build tooling
* [TypeScript](https://typescriptlang.org) - Static typing for scalable, bug-free components
* HTML5 / CSS3 - Clean layouts with semantic markup

---

## 🚀 Getting Started Locally

Follow these quick steps to get a local copy of this simulator running on your machine:

### Prerequisites

Ensure you have **Node.js** installed:
* [Download Node.js](https://nodejs.org)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com
   ```

2. **Navigate into the project directory:**
   ```bash
   cd alu-visualizer
   ```

3. **Install the dependencies:**
   ```bash
   npm install
   ```

4. **Launch the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**  
   Click the link generated in your terminal (usually `http://localhost:5173`) to view the application locally.

---

## 📦 Building and Deployment

### Generate Production Build
To compile and minify the project for a live web server:
```bash
npm run build
```

### Automated Live Deployment
This project uses **GitHub Actions** for automatic deployment to **GitHub Pages**. Whenever changes are pushed to the `main` branch, the workflow compiles the code and automatically updates the [Live Site](https://naaz1401.github.io/alu-visualizer/).

---

## 🤝 Contributing

Contributions to improve visualizations, add new CPU operations, or support wider bit architectures are always welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
