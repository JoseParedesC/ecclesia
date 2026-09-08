import { Global, Module } from '@nestjs/common';
import { AccountingPeriodsService } from './accounting-periods.service';
import { AccountingPeriodsController } from './accounting-periods.controller';

// Global: Income/Expense/Donation lo necesitan sin repetir imports.
@Global()
@Module({
  controllers: [AccountingPeriodsController],
  providers: [AccountingPeriodsService],
  exports: [AccountingPeriodsService],
})
export class AccountingPeriodsModule {}
