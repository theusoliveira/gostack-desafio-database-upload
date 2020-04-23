import csvParse from 'csv-parse';
import fs from 'fs';
import { In, getRepository, getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface TransactionCsv {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(path: string): Promise<Transaction[]> {
    const transactionReadStream = fs.createReadStream(path);

    const categoryRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const parsers = csvParse({
      from_line: 2,
    });

    const transactions: TransactionCsv[] = [];

    const categories = new Set<string>();

    const parseCsv = transactionReadStream.pipe(parsers);
    parseCsv.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.add(category);

      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCsv.on('end', resolve));
    const categoriesFromFile = Array.from(categories);

    const existentCategories = await categoryRepository.find({
      where: {
        title: In(categoriesFromFile),
      },
    });

    const titles = existentCategories.map((cat: Category) => cat.title);

    const categoriesToSave = categoriesFromFile.filter(
      item => !titles.includes(item),
    );

    const dbObjects = categoryRepository.create(
      categoriesToSave.map(item => ({ title: item })),
    );

    await categoryRepository.save(dbObjects);

    const finalCategories = [...existentCategories, ...dbObjects];

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          cat => cat.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);

    fs.promises.unlink(path);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
