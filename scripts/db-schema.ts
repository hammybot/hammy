export const createChallengeStatusType = (schema: string, owner: string): string => {
	return `
		CREATE TYPE ${schema}."challengestatus" AS ENUM
			('PND', 'BET', 'DEC', 'CMP');

		ALTER TYPE ${schema}."challengestatus"
			OWNER TO ${owner};
	`;
};

export const createChallengesTable = (schema: string, owner: string): string => {
	return `
		CREATE TABLE ${schema}.challenges
		(
			"Id" integer NOT NULL GENERATED BY DEFAULT AS IDENTITY ( INCREMENT 1 ),
			"ChallengerId" text NOT NULL,
			"ChallengedId" text NOT NULL,
			"ChannelId" text NOT NULL,
			"Description" text NOT NULL,
			"Status" "challengestatus" NOT NULL,
			"BetLimit" bigint,
			"ChallengerBet" bigint,
			"ChallengedBet" bigint,
			"WinnerId" text,
			CONSTRAINT "PRIMARY_KEY" PRIMARY KEY ("Id")
		)
		WITH (
			OIDS = FALSE
		);

		ALTER TABLE ${schema}.challenges
			OWNER to ${owner};
	`;
};

export const deleteChallengesTable = (schema: string): string => {
	return `
		DROP TABLE ${schema}.challenges
	`;
};

export const deleteChallengeStatusType = (schema: string): string => {
	return `
		DROP TYPE ${schema}.challengestatus
	`;
};