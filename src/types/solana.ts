export type ProgramInfoStruct = {
  programId: string;
  owner: string;
  programdataAddress: string;
  authority: false | "none" | string;
  lastDeploySlot: number;
  dataLen: number;
  lamports: number;
};
