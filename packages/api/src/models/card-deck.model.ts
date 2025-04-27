import { IsArray, IsOptional, IsString } from "class-validator";

import { ICardModel } from "./card.model";

export interface ICardDeckModel {
  readonly id: string;
  readonly title: string;
  readonly cards?: ICardModel[];
}

export class CardDeckModel implements ICardDeckModel {
  @IsString()
  readonly id: string;

  @IsString()
  readonly title: string;

  @IsArray()
  @IsOptional()
  readonly cards?: ICardModel[];
}
