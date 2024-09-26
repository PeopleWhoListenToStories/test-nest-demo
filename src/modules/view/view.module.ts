import { Module } from '@nestjs/common';

import { ViewController } from '~/modules/view/view.controller';
import { ViewService } from '~/modules/view/view.service';

@Module({
  providers: [ViewService],
  exports: [ViewService],
  controllers: [ViewController],
})
export class ViewModule {}
