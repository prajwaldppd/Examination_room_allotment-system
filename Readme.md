# 🏫 Semester End Examination Room Allotment System

Welcome to the **Semester End Examination Room Allotment System**! This application simplifies the process of assigning examination rooms and generating attendance sheets for students. 📚✏️

## 🌟 Features

- **Student List Upload:** Enter student details in an Excel sheet in a specific format.
- **Room Selection:** Choose available rooms for examinations.
- **Automatic Allotment:** Automatically generates room allotments and attendance sheets.
- **CSV & Excel Integration:** Uses JavaScript libraries to handle CSV and Excel sheets.

## 🚀 Getting Started

### 📋 Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (Node Package Manager)

### 📦 Installation

Follow these steps to set up the project on your local machine:

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/prajwaldppd/Examination-room-allotment-system.git
2. **Navigate to the Project Directory:**
    ```bash
    cd Examination-room-allotment-system
3. **Install Node Modules:**
    ```bash 
    npm install
4. **🛠️ Running the Application**
    1. satrting the server 
    ```bash
    node server.js

5. **Acess the Application**
    Open your web browser and go to
    ```bash
    http://localhost:3000/.

## 📝 Usage Instructions
1. Prepare the Student List:

Use the example Excel sheet provided in the example/ directory.
Enter student details following the specified format.
Upload the Student List:

2. Navigate to the upload section of the application.
Select your formatted Excel file.
Select Examination Rooms:

3. Choose the available rooms for the examination.
Generate Room Allotment:

4. Click on the Generate button to create the room allotments and attendance sheets.
Download Attendance Sheets:

Download the generated attendance sheets for each room.
## 🛠️ Technologies Used
Node.js: JavaScript runtime for server-side development.
Express.js: Web framework for handling HTTP requests.
CSV and Excel Libraries:
[csv-parser] "https://www.npmjs.com/package/csv-parser"
[xlsx] "https://www.npmjs.com/package/xlsx"