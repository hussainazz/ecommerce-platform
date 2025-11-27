import { productCollection } from "@db/schemas/product.schema.ts";
import * as Types from "@shared/types/types.ts";
import { ObjectId } from "mongodb";

export class ProductService {
  static async create(
    data: Omit<Types.Product, "_id" | "constructor">,
  ): Promise<Types.Product> {
    const result = await productCollection.insertOne(data);
    return {
      _id: result.insertedId.toString(),
      title: data.title,
      price: data.price,
      category: data.category,
      stock: data.stock,
      description: data.description,
    };
  }

  static async delete(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error(`Invalid product id`);
    const deletedProduct = await productCollection.deleteOne({
      _id: new ObjectId(_id),
    });
    if (deletedProduct.deletedCount === 0)
      throw new Error(`no product was found to delete`);
    return deletedProduct;
  }

  static async findById(_id: string): Promise<Types.Product | null> {
    if (!ObjectId.isValid(_id)) throw new Error(`product id is invalid`);
    const product = await productCollection.findOne({
      _id: new ObjectId(_id),
    });
    if (product === null) throw new Error(`no product was found`);
    return {
      _id: product._id.toString(),
      title: product.title,
      price: product.price,
      category: product.category,
      stock: product.stock,
      description: product.description,
    };
  }
  static async decreaseStock(_id: string, quantityToDecrease: number) {
    if (!ObjectId.isValid(_id)) throw new Error(`product id is invalid`);
    const result = await productCollection.updateOne(
      {
        _id: new ObjectId(_id),
        stock: { $gte: quantityToDecrease },
      },
      { $inc: { stock: -quantityToDecrease } },
    );

    if (result.matchedCount === 0) {
      const findProdById = await productCollection.findOne({
        _id: new ObjectId(_id),
      });
      if (!findProdById) {
        throw new Error(`product ${_id} not exists`);
      } else {
        throw new Error(`product ${_id} is out of stock`);
      }
    }
  }
  static async increaseStock(_id: string, quantityToIncrease: number) {
    if (!ObjectId.isValid(_id)) throw new Error(`product id is invalid`);
    const result = await productCollection.updateOne(
      {
        _id: new ObjectId(_id),
      },
      { $inc: { stock: +quantityToIncrease } },
    );
    if (result.matchedCount === 0) {
      throw new Error(`product ${_id} not exists`);
    }
  }
}
