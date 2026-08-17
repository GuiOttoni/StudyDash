export class Study {
  constructor(
    public readonly id:          number,
    public readonly slug:        string,
    public readonly title:       string,
    public readonly icon:        string,
    public readonly category:    string,
    public readonly description: string,
    public readonly available:   boolean,
    public readonly order:       number,
  ) {}
}

export interface NewStudyData {
  slug:        string
  title:       string
  icon:        string
  category:    string
  description: string
  available:   boolean
  order:       number
}
