import { IsString } from 'class-validator';

export interface ICardModel {
  readonly id: string;
  readonly original: string;
  readonly translation: string;
}

export class CardModel implements ICardModel {
  @IsString()
  readonly id: string;

  @IsString()
  readonly original: string;

  @IsString()
  readonly translation: string;
}
