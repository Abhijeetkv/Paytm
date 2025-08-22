import express from 'express';
import { Account } from '../db.js';
import { authMiddleware } from '../middleware.js';
import mongoose from 'mongoose';

const router = express.Router();

// Route to get account balance
router.get('/balance', authMiddleware, async (req, res) => {
    try {
        const account = await Account.findOne({ userId: req.userId });
        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }
        res.json({ balance: account.balance });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to transfer funds
router.post('/transfer', authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { amount, to } = req.body;
        const fromAccount = await Account.findOne({ userId: req.userId }).session(session);

        if (!fromAccount || fromAccount.balance < amount) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        const toAccount = await Account.findOne({ userId: to }).session(session);
        if (!toAccount) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Recipient account not found' });
        }

        fromAccount.balance -= amount;
        toAccount.balance += amount;

        await fromAccount.save({ session });
        await toAccount.save({ session });

        await session.commitTransaction();
        res.json({ message: 'Transfer successful' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        session.endSession();
    }
});

export default router;