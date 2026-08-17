export class Section {
  constructor(
    public readonly id:          number,
    public readonly slug:        string,
    public readonly title:       string,
    public readonly icon:        string,
    public readonly description: string,
    public readonly categories:  string[],
    public readonly order:       number,
  ) {}

  matchesCategory(category: string): boolean {
    return this.categories.includes(category)
  }

  withCategory(category: string): Section {
    if (this.matchesCategory(category)) return this
    return new Section(this.id, this.slug, this.title, this.icon, this.description, [...this.categories, category], this.order)
  }
}

export interface NewSectionData {
  slug:        string
  title:       string
  icon:        string
  description: string
  categories:  string[]
  order:       number
}
