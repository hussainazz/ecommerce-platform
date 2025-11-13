import { ObjectId } from "mongodb";
import AppError from "@shared/utils/appError.ts";
import { productCollection } from "@db/schemas/product.schema.ts";

export class ProductClass {
  constructor(
    public title: string,
    public price: number,
    public category: string,
    public inventory: number,
    public description: string | null,
    public _id?: string,
    public review?: {
      user_id: string;
      rate: 1 | 2 | 3 | 4 | 5;
      text: string;
    }[],
  ) {}

  static async create(
    data: Omit<ProductClass, "_id" | "constructor">,
  ): Promise<ProductClass> {
    const result = await productCollection.insertOne(data);
    return new ProductClass(
      data.title,
      data.price,
      data.category,
      data.inventory,
      data.description,
      result.insertedId.toString(),
    );
  }

  static async delete(_id: string) {
    if (!ObjectId.isValid(_id)) throw new AppError(`Invalid product id`, 400);
    await productCollection.deleteOne({
      _id: new ObjectId(_id),
    });
  }

  static async findById(_id: string): Promise<ProductClass | null> {
    if (!ObjectId.isValid(_id))
      throw new AppError(`product id is invalid`, 400);
    const product = await productCollection.findOne({
      _id: new ObjectId(_id),
    });
    if (product === null) throw new AppError(`no product was found`, 404);
    return new ProductClass(
      product.title,
      product.price,
      product.category,
      product.inventory,
      product.description,
      product._id.toString(),
      product.review,
    );
  }

  // TODO findMany has a lot to do
}
