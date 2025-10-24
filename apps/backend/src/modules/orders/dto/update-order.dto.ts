import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { OrderStatus, PaymentStatus } from '../entities/order.entity';

export class UpdateOrderDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsDateString()
  @IsOptional()
  estimatedDelivery?: Date;

  @IsDateString()
  @IsOptional()
  deliveredAt?: Date;

  @IsString()
  @IsOptional()
  cancellationReason?: string;

  @IsString()
  @IsOptional()
  paymentReference?: string;
}
