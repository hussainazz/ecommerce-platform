import { ObjectId } from "mongodb";
import { orderCollection } from "@db/schemas/order.schema.ts";
import * as Types from "@shared/types/types.ts";
import { productCollection } from "@db/schemas/product.schema.ts";
import { ProductService } from "@features/products/product.service.ts";
import { Long } from "mongodb";

export class OrderService {
  static async create(
    data: Pick<Types.Order, "shipping_address" | "products" | "user_id">,
  ): Promise<Types.Order> {
    const orderProducts = data.products.map((prod) => {
      if (!ObjectId.isValid(prod.product_id)) {
        throw new Error(`product id ${prod.product_id} not valid`);
      }
      return { ...prod, product_id: new ObjectId(prod.product_id) };
    });
    const foundProducts = await Promise.all(
      orderProducts.map((prod) =>
        productCollection.findOne({ _id: prod.product_id }),
      ),
    );
    if (foundProducts.some((el) => !el)) {
      throw new Error("at least one product id not exist");
    }

    let totalPrice = BigInt(0);
    const foundProductsMap = new Map(
      foundProducts.map((prod) => [prod._id.toString(), prod]),
    );
    for (const ordProd of orderProducts) {
      const prodPrice = foundProductsMap.get(
        ordProd.product_id.toString(),
      ).price;
      totalPrice += BigInt(prodPrice.toString()) * BigInt(ordProd.count);
      await ProductService.decreaseStock(ordProd.product_id, ordProd.count);
    }

    const created_at = new Date();
    const result = await orderCollection.insertOne({
      ...data,
      product: orderProducts,
      user_id: new ObjectId(data.user_id),
      status: "pending",
      created_at,
      totalPrice: Long.fromBigInt(totalPrice),
    });
    return {
      _id: result.insertedId.toString(),
      status: "pending",
      shipping_address: data.shipping_address,
      totalPrice,
      products: data.products,
      user_id: data.user_id,
      created_at,
    };
  }

  static async findUserOrders(userId: string) {
    const result = await orderCollection
      .find({ user_id: userId })
      .project({ status: 1, totoalPrice: 1 })
      .toArray();
    return result;
  }

  static async findById(_id: string): Promise<Types.Order> {
    if (!ObjectId.isValid(_id)) throw new Error("order id is invalid");
    const result = await orderCollection.findOne({ _id: new ObjectId(_id) });
    if (!result) throw new Error("no order found");
    return {
      _id: result.insertedId.toString(),
      status: result.status,
      shipping_address: result.shipping_address,
      totalPrice: result.totalPrice,
      products: result.products,
      user_id: result.user_id,
      created_at: result.created_at,
      canceled_at: result.canceled_at,
      completed_at: result.completed_at,
      confirmed_at: result.confirmed_at,
    };
  }

  static async delete(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error("order id is invalid");
    const result = await orderCollection.findOneAndDelete({
      _id: new ObjectId(_id),
    });
    if (!result) {
      throw new Error("order no longer exists");
    }
    if (result.status === "canceled") return;
    await Promise.all(
      result.products.map((prod: any) =>
        ProductService.increaseStock(prod.product_id, prod.count),
      ),
    );
  }

  static async updateItems(
    _id: string,
    newItems: { product_id: string; count: number }[],
  ) {
    const orderToUpdate = await this.findById(_id);
    const prevItemsMap = new Map(
      orderToUpdate.products.map((prod) => [
        prod.product_id.toString(),
        prod.count,
      ]),
    );
    let ops = [];
    for (const item of newItems) {
      const newId = item.product_id;
      const newCount = item.count;
      // if item is new, set this to 0
      const prevCount = prevItemsMap.get(newId) || 0;

      const delta = newCount - prevCount;
      if (delta > 0) {
        ops.push(ProductService.decreaseStock(newId, delta));
      } else if (delta < 0) {
        ops.push(ProductService.increaseStock(newId, -delta));
      }
      prevItemsMap.delete(newId);
    }
    for (const [removedItem_id, removedItem_count] of prevItemsMap) {
      ops.push(ProductService.increaseStock(removedItem_id, removedItem_count));
    }
    await Promise.all([
      ...ops,
      orderCollection.updateOne(
        { _id: new ObjectId(_id) },
        { $set: { proudcts: newItems, updated_at: new Date() } },
      ),
    ]);
  }

  static async cancel(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error("order id is invalid");
    const canceledOrder = await orderCollection.findOneAndUpdate(
      { _id: new ObjectId(_id) },
      { $set: { status: "canceled", canceled_at: new Date() } },
    );
    if (!canceledOrder) {
      throw new Error("no order found to cancel");
    }
    await Promise.all(
      canceledOrder.products.map((prod: any) =>
        ProductService.increaseStock(prod.product_id, prod.count),
      ),
    );
  }

  static async confirm(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error("order id is invalid");
    const confirmedOrder = await orderCollection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { status: "confirmed", confirmed_at: new Date() } },
    );
    if (confirmedOrder.modifiedCount !== 1)
      throw new Error("no order found to confirm");
  }

  static async complete(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error("order id is invalid");
    const completedOrder = await orderCollection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { status: "completed", completed_at: new Date() } },
    );
    if (completedOrder.modifiedCount !== 1)
      throw new Error("no order found to complete");
  }
}
