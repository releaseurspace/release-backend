import { CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';

export class CommonEntity {
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updatedAt: Date | null;
}
