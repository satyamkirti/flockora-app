export type Flock = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type FlockWithCount = Flock & {
  birdCount: number;
};
