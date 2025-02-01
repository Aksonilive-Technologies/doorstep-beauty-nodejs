const dotenv = require("dotenv");
dotenv.config();
const { exec } = require("child_process");
const path = require("path");

// MongoDB Connection Config
const DATABASE = "test"; // Replace with your actual backup database name
const NEW_DATABASE = "test2";

// we only need to restore the database in case of emergency

// const MONGO_URI = "mongodb+srv://production:YZUGXzBZ1oR3jNJp@cluster0.gchpz.mongodb.net/your_database_name?retryWrites=true&w=majority&appName=Cluster0";
const BACKUP_FILE = "test_2025-02-01_10-55-00.gz"; // Replace with the actual backup file name

const restoreDatabase = () => {
    const backupFilePath = path.join(__dirname, "../backups");

    // this we need to use when we want to restore the database with the same name
    // const mongorestoreCommand = `mongorestore --uri="${MONGO_URI}" --archive=${backupFilePath}/${BACKUP_FILE} --gzip --nsInclude=${DATABASE}.*`;
    
    // this we need to use when we want to restore the database with the different name
    const mongorestoreCommand = `mongorestore --uri="${process.env.db_url}" --archive=${backupFilePath}/${BACKUP_FILE} --gzip --nsFrom=${DATABASE}.* --nsTo=${NEW_DATABASE}.*`;


    exec(mongorestoreCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Restore failed: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Restore STDERR: ${stderr}`);
            return;
        }
        console.log("Database restore successful!");
    });
};


restoreDatabase();
