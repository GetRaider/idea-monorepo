import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { plainToInstance } from 'class-transformer';
import { InjectModel } from '@nestjs/mongoose';

import {
  IUserEntity,
  CardDeckDocument,
  CardDeckEntity,
  ICardDeckEntity,
} from '@schemas/index';
import {
  CreateCardDeckRequestDto,
  CreateCardDeckResponseDto,
} from '@modules/card-deck/dto/create-card-deck.dto';
import {
  GetCardDeckRequestDto,
  GetCardDeckResponseDto,
} from '@modules/card-deck/dto/get-card-decks.dto';
import {
  CardDeckModel,
  ICardDeckModel,
} from '@denzel/api/src/models/card-deck.model';
import {
  UpdateCardDeckRequestDto,
  UpdateCardDeckResponseDto,
} from '@modules/card-deck/dto/update-card-deck.dto';

@Injectable()
export class CardDeckService {
  constructor(
    @InjectModel(CardDeckEntity.name)
    private readonly cardDeckModel: Model<CardDeckDocument>,
    private readonly logger: Logger,
  ) {}

  async create(
    dto: CreateCardDeckRequestDto,
  ): Promise<CreateCardDeckResponseDto> {
    const { title, cards = [] } = dto;

    if (await this.isAlreadyExistByName(title)) {
      throw new HttpException(
        `Card deck with the '${title}' title already exist`,
        HttpStatus.CONFLICT,
      );
    }

    const newDocument = new this.cardDeckModel<ICardDeckEntity>({
      _id: randomUUID(),
      title,
      cards,
    });

    const savedDocument = await newDocument.save();

    this.logger.warn(`Following card deck has been saved: ${savedDocument}`);
    return {
      cardDeck: plainToInstance(
        CardDeckModel,
        savedDocument.toJSON<ICardDeckModel>(),
      ),
    };
  }

  async updateById(
    id: string,
    dto: UpdateCardDeckRequestDto,
  ): Promise<UpdateCardDeckResponseDto> {
    const updatedCardDeck = await this.cardDeckModel.findByIdAndUpdate(
      id,
      dto,
      {
        new: true,
      },
    );

    return {
      cardDeck: plainToInstance(
        CardDeckModel,
        updatedCardDeck.toJSON<ICardDeckModel>(),
      ),
    };
  }

  async isAlreadyExistByName(title: string): Promise<boolean> {
    return (await this.getByQuery({ title: [title] })).cardDecks.length > 0;
  }

  async getByQuery(
    query: GetCardDeckRequestDto = {},
  ): Promise<GetCardDeckResponseDto> {
    const { id: idArr, title: titleArr } = query;

    const filterQuery: FilterQuery<IUserEntity> = {
      ...(idArr ? { _id: { $in: idArr } } : {}),
      ...(titleArr ? { title: { $in: titleArr } } : {}),
    };

    const foundDocuments = await this.cardDeckModel.find(filterQuery);
    return {
      cardDecks: foundDocuments.map((foundDocument) =>
        plainToInstance(CardDeckModel, foundDocument.toJSON<ICardDeckModel>()),
      ),
    };
  }

  async deleteById(id: string): Promise<void> {
    await this.cardDeckModel.findByIdAndDelete(id);
  }

  async deleteAll(): Promise<void> {
    await this.cardDeckModel.deleteMany({ login: { $gte: '@gmail' } });
  }
}
