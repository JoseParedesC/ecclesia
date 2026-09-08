import { Module } from '@nestjs/common';
import { MassIntentionsService } from './mass-intentions.service';
import { MassIntentionsController } from './mass-intentions.controller';

@Module({
  controllers: [MassIntentionsController],
  providers: [MassIntentionsService],
  exports: [MassIntentionsService],
})
export class MassIntentionsModule {}
