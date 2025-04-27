import { IsArray, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { propertyHelper } from '@denzel/api/src/helpers/property.helper';
import { CardDeckModel, ICardDeckModel } from '@denzel/api/src/models/index';

interface IGetCardDeckArgs {
  readonly id?: Array<string>;
  readonly title?: Array<string>;
}

interface IGetCardDeckResult {
  readonly cardDecks: ICardDeckModel[];
}

export class GetCardDeckRequestDto implements IGetCardDeckArgs {
  @Transform(propertyHelper.transformValueToArray)
  @IsOptional()
  @IsArray()
  readonly id?: Array<string>;

  @Transform(propertyHelper.transformValueToArray)
  @IsOptional()
  @IsArray()
  readonly title?: Array<string>;
}

export class GetCardDeckResponseDto implements IGetCardDeckResult {
  @IsObject()
  @Type(() => CardDeckModel)
  @ValidateNested()
  readonly cardDecks: ICardDeckModel[];
}
