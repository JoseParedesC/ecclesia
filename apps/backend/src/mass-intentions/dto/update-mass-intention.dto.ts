import { PartialType } from '@nestjs/mapped-types';
import { CreateMassIntentionDto } from './create-mass-intention.dto';

export class UpdateMassIntentionDto extends PartialType(CreateMassIntentionDto) {}
