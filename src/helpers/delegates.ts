import { Delegate, DelegateWithPercent } from '@/helpers/interfaces';

type QueryParams = {
  first: number;
  skip: number;
  id: string;
  orderBy?: string;
};

abstract class StandardConfig {
  abstract getQuery(params: QueryParams): Record<string, any>;
  abstract formatResponse(response: Record<string, any>): DelegateWithPercent[];
  abstract initializeUser(address: string): Delegate[];
  abstract getContractDelegateMethod(): { abi: string[]; action: string };
}

export class CompoundGovernorConfig extends StandardConfig {
  getQuery(params: QueryParams) {
    const { first, skip, orderBy, id } = params;
    return {
      delegates: {
        __args: {
          first,
          skip,
          orderBy: orderBy ? orderBy : 'delegatedVotes',
          orderDirection: 'desc',
          where: id ? { id } : {}
        },
        id: true,
        delegatedVotes: true,
        delegatedVotesRaw: true,
        tokenHoldersRepresentedAmount: true
      },
      governance: {
        __args: {
          id: 'GOVERNANCE'
        },
        delegatedVotes: true,
        totalTokenHolders: true,
        totalDelegates: true
      }
    };
  }

  formatResponse(response: {
    governance: any;
    delegates: any;
  }): DelegateWithPercent[] {
    type Governance = {
      delegatedVotes: string;
      totalTokenHolders: string;
      totalDelegates: string;
    };

    type Delegate = {
      id: string;
      delegatedVotes: string;
      delegatedVotesRaw: string;
      tokenHoldersRepresentedAmount: number;
    };

    const governanceData = response.governance as Governance;
    const delegatesData = response.delegates as Delegate[];

    return delegatesData.map(delegate => {
      const delegatorsPercentage =
        (Number(delegate.tokenHoldersRepresentedAmount) /
          Number(governanceData.totalTokenHolders)) *
        100;
      const votesPercentage =
        (Number(delegate.delegatedVotes) /
          Number(governanceData.delegatedVotes)) *
        100;

      return {
        ...delegate,
        delegatorsPercentage,
        votesPercentage,
        statement:
          Math.random() > 0.5
            ? 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Vero commodi error unde harum facilis eveniet fugit, ut placeat rerum officiis autem.'
            : ''
      };
    });
  }

  initializeUser(address: string): Delegate[] {
    return [
      {
        id: address,
        delegatedVotes: '0',
        delegatedVotesRaw: '0',
        tokenHoldersRepresentedAmount: 0
      }
    ];
  }

  getContractDelegateMethod(): { abi: string[]; action: string } {
    return {
      abi: ['function delegate(address delegatee)'],
      action: 'delegate'
    };
  }
}

export function createStandardConfig(standard: string): StandardConfig {
  switch (standard) {
    case 'compound-governor':
      return new CompoundGovernorConfig();

    default:
      throw new Error(`Unsupported standard: ${standard}`);
  }
}
