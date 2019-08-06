import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum ChallengeStatusEntity {
	PendingAccept = 'PND',
	PendingBets = 'BET',
	Declined = 'DEC',
	Completed = 'CMP'
}

@Entity()
export class ChallengeEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	challengerUserId!: string;

	@Column()
	challengedUserId!: string;

	@Column()
	textChannelId!: string;

	@Column('text')
	originalDescription!: string;

	@Column('text')
	translatedDescription!: string;

	@Column({
		type: 'enum',
		enum: ChallengeStatusEntity,
		default: ChallengeStatusEntity.PendingAccept
	})
	status!: string;

	@Column({ nullable: true })
	betLimit: number | undefined;

	@Column({ nullable: true })
	challengerBet: number | undefined;

	@Column({ nullable: true })
	challengedBet: number | undefined;
}
