import {
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import {
  ICardModel,
  CardDeckModel,
  ICardDeckModel,
} from '@denzel/api/src/models/index';

interface IUpdateCardDeckArgs {
  readonly title?: string;
  readonly cards?: ICardModel[];
}

interface IUpdateCardDeckResult {
  readonly cardDeck: ICardDeckModel;
}

export class UpdateCardDeckRequestDto implements IUpdateCardDeckArgs {
  @IsString()
  @IsOptional()
  readonly title?: string;

  @IsString()
  @IsOptional()
  readonly cards?: ICardModel[];
}

export class UpdateCardDeckResponseDto implements IUpdateCardDeckResult {
  @IsObject()
  @Type(() => CardDeckModel)
  @ValidateNested()
  readonly cardDeck: ICardDeckModel;
}
