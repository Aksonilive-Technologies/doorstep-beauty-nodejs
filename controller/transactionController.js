const Transaction = require('../models/transaction'); // Assuming the model is in the 'models' directory

// Add a new transaction
exports.addTransaction = async (req, res) => {
    try {
        const transaction = new Transaction(req.body);
        await transaction.save();
        res.status(201).json({
            success: true,
            message: 'Transaction added successfully',
            transaction,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding transaction',
            error: error.message,
        });
    }
};

// Get all transactions
exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find();
        res.status(200).json({
            success: true,
            transactions,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving transactions',
            error: error.message,
        });
    }
};

// Get transactions by customerId
exports.getTransactionsByCustomerId = async (req, res) => {
    try {
        const transactions = await Transaction.find({ customerId: req.params.customerId });
        res.status(200).json({
            success: true,
            transactions,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving transactions',
            error: error.message,
        });
    }
};

// Update a transaction status
exports.updateTransactionStatus = async (req, res) => {
    try {
        const transaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Transaction status updated successfully',
            transaction,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating transaction status',
            error: error.message,
        });
    }
};

// Delete a transaction
exports.deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            { isDeleted: true },
            { new: true }
        );
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully',
            transaction,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting transaction',
            error: error.message,
        });
    }
};
