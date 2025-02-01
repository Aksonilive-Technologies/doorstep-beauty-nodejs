const dotenv = require("dotenv");
dotenv.config({ path: '/var/www/doorstep-beauty-backend/.env' });
const cron = require("node-cron");
const { google } = require("googleapis");
const fs = require("fs");
const { exec } = require("child_process");
const moment = require("moment");
const path = require("path");

// MongoDB Connection Config
const BACKUP_PATH = "./backups"; // Local backup folder
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID; // Replace with your Drive folder ID
const DATABASE = "test"; // Replace with your actual backup database name

// Add MongoDB tools to the PATH only if not already present
process.env.PATH = process.env.PATH + ':' + "/usr/local/bin/mongodb-database-tools/bin";

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_PATH)) {
    fs.mkdirSync(BACKUP_PATH, { recursive: true });
}

// Authenticate Google Drive API
const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
    scopes: ["https://www.googleapis.com/auth/drive"],
});
const drive = google.drive({ version: "v3", auth });

// Function to take a MongoDB Backup
const backupDatabase = async () => {
    const timestamp = moment().format("YYYY-MM-DD_HH-mm-ss");
    const backupFile = `${DATABASE}_${timestamp}.gz`;
    const backupFilePath = path.join(BACKUP_PATH, backupFile);

    const mongodumpCommand = `mongodump --uri="${process.env.db_url}" --archive="${backupFilePath}" --gzip --db=${DATABASE}`;

    exec(mongodumpCommand, async (error, stdout, stderr) => {
        if (error) {
            console.error(`Backup failed: ${error.message}`);
            return;
        }
        console.log(`Backup successful: ${backupFile}`);

        // Upload to Google Drive
        await uploadToDrive(backupFilePath, backupFile);
    });
};

// Function to Upload Backup to Google Drive
const uploadToDrive = async (filePath, fileName) => {
    try {
        const fileMetadata = {
            name: fileName,
            parents: [GOOGLE_DRIVE_FOLDER_ID],
        };

        const media = {
            mimeType: "application/gzip",
            body: fs.createReadStream(filePath),
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: "id",
        });

        // console.log(`Backup uploaded to Google Drive: ${response.data.id}`);

        // Delete the local backup file after successful upload
        deleteLocalBackup(filePath);
    } catch (error) {
        console.error("Error uploading backup to Google Drive:", error.message);
    }
};

// Function to Delete Local Backup File
const deleteLocalBackup = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error("Error deleting local backup file:", err.message);
        } else {
            // console.log(`Local backup file deleted: ${filePath}`);
        }
    });
};


// Schedule Backup Job to Run Every Day at Midnight
cron.schedule("0 0 * * *", () => {
    console.log("Starting database backup...");
    backupDatabase();
});


// cron.schedule("*/1 * * * *", () => {
//     console.log("Starting database backup...");
//     backupDatabase();
// });

console.log("MongoDB Backup Scheduler is running...");