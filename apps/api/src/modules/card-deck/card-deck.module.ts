import { Logger, Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { CardDeckEntity, CardDeckSchema } from '@schemas/card-deck.schema';
import { CardDeckController } from '@modules/card-deck/card-deck.controller';
import { CardDeckService } from '@modules/card-deck/card-deck.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CardDeckEntity.name, schema: CardDeckSchema },
    ]),
    // forwardRef(() => AuthModule),
  ],
  controllers: [CardDeckController],
  providers: [CardDeckService, Logger],
  exports: [],
})
export class CardDeckModule {}
