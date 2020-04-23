import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const income = transactions
      .map(item => item)
      .filter(current => current.type === 'income')
      .reduce((total, curr) => Number(curr.value) + Number(total), 0);
    const outcome = transactions
      .map(item => item)
      .filter(current => current.type === 'outcome')
      .reduce((total, curr) => Number(curr.value) + Number(total), 0);

    const total = income - outcome;

    return {
      income,
      outcome,
      total,
    };
  }
}

export default TransactionsRepository;
