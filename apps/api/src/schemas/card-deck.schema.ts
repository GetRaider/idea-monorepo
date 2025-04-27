import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { ICardModel } from '@denzel/api/src/models/card.model';

export type CardDeckDocument = ICardDeckEntity & Document;

export interface ICardDeckEntity {
  readonly _id: string;
  readonly title: string;
  readonly cards?: ICardModel[];
}

@Schema({
  collection: 'card-decks',
  autoCreate: true,
  versionKey: false,
  strict: false,
  timestamps: { createdAt: true, updatedAt: true },
})
export class CardDeckEntity implements ICardDeckEntity {
  @Prop({
    type: String,
    required: true,
    default: () => uuidv4(),
  })
  readonly _id: string;

  @Prop({ type: String, required: true })
  readonly title: string;

  @Prop({
    type: Array,
    required: false,
    default: [],
    set: (cards: ICardModel[]) =>
      cards.map((card) => ({
        _id: uuidv4(),
        ...card,
      })),
  })
  readonly cards?: ICardModel[];
}

export const CardDeckSchema = SchemaFactory.createForClass(CardDeckEntity);
