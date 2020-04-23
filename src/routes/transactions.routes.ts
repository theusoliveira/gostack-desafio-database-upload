import { Router } from 'express';
import { getCustomRepository } from 'typeorm';

import multer from 'multer';
import uploadConfig from '../config/upload';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (req, res) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const transactions = await transactionsRepository.find({
    relations: ['category'],
  });

  return res.json({
    transactions,
    balance: await transactionsRepository.getBalance(),
  });
});

transactionsRouter.post('/', async (req, res) => {
  const { title, type, value, category } = req.body;

  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({
    title,
    type,
    value,
    category,
  });

  return res.json(transaction);
});

transactionsRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const deleteService = new DeleteTransactionService();

  await deleteService.execute({ id });

  return res.sendStatus(204);
});

transactionsRouter.post('/import', upload.single('file'), async (req, res) => {
  const importService = new ImportTransactionsService();

  const transactions = await importService.execute(req.file.path);

  return res.json(transactions);
});

export default transactionsRouter;
