
## ServerEntity Account — Description="Represents a company"; Public=true
| 属性 | 型 | 必須 | 長さ | 既定値 | 説明 | その他 |
|---|---|---|---|---|---|---|
| Id | Integer |  |  |  |  | IsAutoNumber=AutoNumber.Yes |
| IsActive | Boolean | Y |  |  | Indicates that the record is active |  |
| Company | Text | Y | 100 |  | Company name |  |
| Code | Text | Y | 10 |  | Account unique code |  |
| Contact | Text | Y | 100 |  | Main contact inside the company |  |
| CountryId | FK→country |  |  |  | Company country |  |
| Address | Text |  | 250 |  | Company address |  |
| City | Text |  | 50 |  | Company city |  |
| PostalCode | Text |  | 50 |  | Company postal code |  |
| Phone | PhoneNumber |  |  |  | Company phone number |  |
| Email | Email |  |  |  | Company email |  |
| CreatedBy | FK→user | Y |  |  | User that created the record |  |
| CreatedOn | DateTime | Y |  |  | Timestamp when the record was created |  |
| UpdatedBy | FK→user |  |  |  | Last user that updated the record |  |
| UpdatedOn | DateTime |  |  |  | Timestamp when the record was updated by the last time |  |

## ServerEntity Country — Description="Country"; IsMultiTenant=OutSystems.Model.Enumerations.BooleanWithInheritance.No; Public=true
| 属性 | 型 | 必須 | 長さ | 既定値 | 説明 | その他 |
|---|---|---|---|---|---|---|
| Id | LongInteger |  |  |  |  | IsAutoNumber=AutoNumber.Yes |
| Code | Text | Y | 50 |  | Country code |  |
| Name | Text | Y | 100 |  | Country name |  |
| CreatedBy | FK→user | Y |  |  | User that created the record |  |
| CreatedOn | DateTime | Y |  |  | Timestamp when the record was created |  |
| UpdatedBy | FK→user |  |  |  | Last user that updated the record |  |
| UpdatedOn | DateTime |  |  |  | Timestamp when the record was updated by the last time |  |
| IsActive | Boolean | Y |  |  | Indicates that the record is active |  |

## ServerEntity Brand — Description="Entity that holds the records of type Brand."; IsMultiTenant=OutSystems.Model.Enumerations.BooleanWithInheritance.No; Public=true
| 属性 | 型 | 必須 | 長さ | 既定値 | 説明 | その他 |
|---|---|---|---|---|---|---|
| Id | LongInteger |  |  |  | Unique Brand record identifier. | IsAutoNumber=AutoNumber.Yes |
| Name | Text | Y | 50 |  | Name of the product brand. |  |
| IsActive | Boolean |  |  | "True" | Holds True if record is active, and False if otherwise. |  |
| CreatedBy | FK→user |  |  |  | Identifier for the user that created the record. | DeleteRule=DeleteRule.Ignore |
| CreatedOn | DateTime |  |  |  | Date and time in which the record was created. |  |
| UpdatedBy | FK→user |  |  |  | Identifier for the user that updated the record. | DeleteRule=DeleteRule.Ignore |
| UpdatedOn | DateTime |  |  |  | Date and time in which the record was updated. |  |

## ServerEntity Model — Description="Entity that holds the records of type Model for products."; IsMultiTenant=OutSystems.Model.Enumerations.BooleanWithInheritance.No; Public=true
| 属性 | 型 | 必須 | 長さ | 既定値 | 説明 | その他 |
|---|---|---|---|---|---|---|
| Id | LongInteger |  |  |  | Unique product Model record identifier. | IsAutoNumber=AutoNumber.Yes |
| Name | Text | Y | 50 |  | Name of the product Model. |  |
| BrandId | FK→brand | Y |  |  | Identifier of the brand of the product model. |  |
| IsActive | Boolean |  |  | "True" | Holds True if record is active, and False if otherwise. |  |
| CreatedBy | FK→user |  |  |  | Identifier for the user that created the record. | DeleteRule=DeleteRule.Ignore |
| CreatedOn | DateTime |  |  |  | Date and time in which the record was created. |  |
| UpdatedBy | FK→user |  |  |  | Identifier for the user that updated the record. | DeleteRule=DeleteRule.Ignore |
| UpdatedOn | DateTime |  |  |  | Date and time in which the record was updated. |  |

## ServerEntity Opportunity — Description="Represents an opportunity associated with a company"; Public=true
| 属性 | 型 | 必須 | 長さ | 既定値 | 説明 | その他 |
|---|---|---|---|---|---|---|
| Id | Integer |  |  |  |  | IsAutoNumber=AutoNumber.Yes |
| IsActive | Boolean | Y |  |  | Indicates that the record is active |  |
| Name | Text | Y | 100 |  | Opportunity name |  |
| AccountId | FK→account | Y |  |  | Account of the Opportunity |  |
| Description | Text |  | 1500 |  | Opportunity description |  |
| OpportunityTypeId | FK→opportunity | Y |  |  | Opportunity type |  |
| OpportunityStageId | FK→opportunityStage | Y |  |  | Opportunity stage |  |
| Amount | Currency |  |  |  | Estimated total sale amount |  |
| Probability | Decimal |  | 2 |  | Percentage of estimated confidence in closing the opportunity | Decimals=0 |
| ExpectedRevenue | Currency |  |  |  | Opportunity expected revenue |  |
| CloseOn | DateTime |  |  |  | Date expected to close the opportunity |  |
| CreatedBy | FK→user | Y |  |  | User that created the record |  |
| CreatedOn | DateTime | Y |  |  | Timestamp when the record was created |  |
| UpdatedBy | FK→user |  |  |  | Last user that updated the record |  |
| UpdatedOn | DateTime |  |  |  | Timestamp when the record was updated by the last time |  |

## StaticEntity OpportunityType — Description="Opportunity type"; Public=true
| 属性 | 型 | 必須 | 長さ | 既定値 | 説明 | その他 |
|---|---|---|---|---|---|---|
| Id | Integer |  |  |  |  | IsAutoNumber=AutoNumber.Yes |
| Label | Text | Y | 50 |  | Label |  |
| Order | Integer | Y |  |  | Order |  |
| IsActive | Boolean | Y |  |  | Indicates that the record is active |  |
- record `NewBusiness`: IsActive="True", Label="\"New business\"", Order="1"
- record `ExistingBusiness`: IsActive="True", Order="2", Label="\"Existing business\""

## StaticEntity OpportunityStage — Description="Opportunity stage"; Public=true
| 属性 | 型 | 必須 | 長さ | 既定値 | 説明 | その他 |
|---|---|---|---|---|---|---|
| Id | Integer |  |  |  |  | IsAutoNumber=AutoNumber.Yes |
| Label | Text | Y | 50 |  | Label |  |
| Order | Integer | Y |  |  | Order |  |
| IsActive | Boolean | Y |  |  | Indicates that the record is active |  |
- record `ProposalMade`: IsActive="True", Label="\"Proposal made\"", Order="3"
- record `Negotiation`: IsActive="True", Order="4", Label="\"Negotiation\""
- record `ClosedLost`: IsActive="True", Order="6", Label="\"Closed lost\""
- record `Investigation`: Label="\"Investigation\"", IsActive="True", Order="2"
- record `Prospecting`: IsActive="True", Label="\"Prospecting\"", Order="1"
- record `ClosedWon`: IsActive="True", Label="\"Closed won\"", Order="5"

## ServerEntity Order — Description="Sales order"; Public=true
| 属性 | 型 | 必須 | 長さ | 既定値 | 説明 | その他 |
|---|---|---|---|---|---|---|
| Id | Integer |  |  |  |  | IsAutoNumber=AutoNumber.Yes |
| IsActive | Boolean | Y |  |  | Indicates that the record is active |  |
| Code | Text | Y | 10 |  | Order unique code |  |
| AccountId | FK→account | Y |  |  | Account associated with current order |  |
| OpportunityId | FK→opportunity |  |  |  | Opportunity associated with current order |  |
| TotalAmount | Decimal |  | 37 | "0" | Order total amount, the sum of order items | Decimals=8 |
| OrderStatusId | FK→orderStatus | Y |  |  | Order status |  |
| ExpectedClosedOn | Date |  |  |  |  |  |
| RequiredOn | DateTime |  |  |  |  |  |
| ShippedOn | DateTime |  |  |  | Timestamp when the order was shipped |  |
| CreatedBy | FK→user | Y |  |  | User that created the record |  |
| CreatedOn | DateTime | Y |  |  | Timestamp when the record was created |  |
| UpdatedBy | FK→user |  |  |  | Last user that updated the record |  |
| UpdatedOn | DateTime |  |  |  | Timestamp when the record was updated by the last time |  |

## StaticEntity OrderStatus — Description="Order status"; Public=true
| 属性 | 型 | 必須 | 長さ | 既定値 | 説明 | その他 |
|---|---|---|---|---|---|---|
| Id | Integer |  |  |  |  | IsAutoNumber=AutoNumber.Yes |
| Label | Text | Y | 50 |  | Label |  |
| Order | Integer | Y |  |  | Order |  |
| Description | Text |  | 200 |  | Description |  |
| IconNameId | FK→iconName |  |  |  | Icon associated with current status |  |
| ColorRGB | Text |  | 50 |  | Icon color associated with current status |  |
- record `Rejected`: IconNameId="Entities.IconName.eraser", ColorRGB="\"rgb(234,140,138)\"", Label="\"Rejected\"", Order="4", Description="\"The order was rejected.\""
- record `Closed`: Order="3", Description="\"The order was closed.\"", IconNameId="Entities.IconName.times", ColorRGB="\"rgb(216,42,39)\"", Label="\"Approved & Closed\""
- record `Submitted`: Label="\"Submitted\"", Description="\"Submitted.\"", Order="2", IconNameId="Entities.IconName.download", ColorRGB="\"rgb(228,175,5)\""
- record `Draft`: Order="1", Label="\"Draft\"", ColorRGB="\"rgba(144,164,174 ,1)\"", IconNameId="Entities.IconName.file_text_o"

## ServerEntity OrderItem — Description="Order item"; Public=true
| 属性 | 型 | 必須 | 長さ | 既定値 | 説明 | その他 |
|---|---|---|---|---|---|---|
| Id | Integer |  |  |  |  | IsAutoNumber=AutoNumber.Yes |
| IsActive | Boolean | Y |  |  | Indicates that the record is active |  |
| CreatedOn | DateTime | Y |  |  | Timestamp when the record was created |  |
| OrderId | FK→order3 | Y |  |  | Order associated with order item |  |
| ProductId | FK→product | Y |  |  | Product sold |  |
| Quantity | Integer | Y |  |  | Quantity |  |
| Discount | Decimal |  | 2 |  | Percentage of discount | Decimals=0 |
| Amount | Currency |  |  |  | Total amount of the order item |  |
| CreatedBy | FK→user | Y |  |  | User that created the record |  |
| UpdatedBy | FK→user |  |  |  | Last user that updated the record |  |
| UpdatedOn | DateTime |  |  |  | Timestamp when the record was updated by the last time |  |

## ServerEntity Product — Description="Product, can be added on OrderItems"; Public=true
| 属性 | 型 | 必須 | 長さ | 既定値 | 説明 | その他 |
|---|---|---|---|---|---|---|
| Id | Integer |  |  |  |  | IsAutoNumber=AutoNumber.Yes |
| Code | Text | Y | 10 |  | Product unique code |  |
| Name | Text | Y | 250 |  | Product name |  |
| Description | Text |  | 1000 |  | Product description |  |
| CategoryId | FK→productCategory | Y |  |  | Product category |  |
| ModelId | FK→model |  |  |  |  |  |
| Price | Currency | Y |  |  | Unit price |  |
| Discount | Decimal |  | 37 |  | Percentage of discount that will be applied on top of the product price. | Decimals=8 |
| Stock | Integer |  |  |  | Value indicating the product availability. |  |
| Reference | Text |  | 50 |  | Numeric identifier of the product. |  |
| EAN | Text |  | 50 |  | Number of the article. |  |
| Weight | Text |  | 50 |  | Weight of the product in kilograms. |  |
| Dimensions | Text |  | 150 |  | Physical dimensions of the product in millimeters. |  |
| CreatedBy | FK→user | Y |  |  | User that created the record |  |
| CreatedOn | DateTime | Y |  |  | Timestamp when the record was created |  |
| UpdatedBy | FK→user |  |  |  | Last user that updated the record |  |
| UpdatedOn | DateTime |  |  |  | Timestamp when the record was updated by the last time |  |
| IsActive | Boolean |  |  |  | Indicates that the record is active |  |
| ReorderLevel | Integer |  |  |  | Stock level that triggers reordering (added by Devin via O11 MCP Beta write test) |  |

## ServerEntity ProductCategory — Description="Product category"; Public=true
| 属性 | 型 | 必須 | 長さ | 既定値 | 説明 | その他 |
|---|---|---|---|---|---|---|
| Id | Integer |  |  |  |  | IsAutoNumber=AutoNumber.Yes |
| Code | Text |  | 10 |  | Category unique code |  |
| Name | Text | Y | 50 |  | Category name |  |
| Description | Text |  | 250 |  | Category description |  |
| CreatedBy | FK→user | Y |  |  | User that created the record |  |
| CreatedOn | DateTime | Y |  |  | Timestamp when the record was created |  |
| UpdatedBy | FK→user |  |  |  | Last user that updated the record |  |
| UpdatedOn | DateTime |  |  |  | Timestamp when the record was updated by the last time |  |
| IsActive | Boolean | Y |  |  | Indicates that the record is active |  |

## ServerEntity ProductFeature — Description="Entity that holds the features for products"; IsMultiTenant=OutSystems.Model.Enumerations.BooleanWithInheritance.No; Public=true
| 属性 | 型 | 必須 | 長さ | 既定値 | 説明 | その他 |
|---|---|---|---|---|---|---|
| Id | LongInteger |  |  |  | ProductFeature Identifier | IsAutoNumber=AutoNumber.Yes |
| ProductId | FK→product | Y |  |  | Product Identifier | DeleteRule=DeleteRule.Delete |
| Description | Text | Y | 100 |  | Feature description |  |
| IsActive | Boolean |  |  | "True" | Holds True if record is active, and False if otherwise. |  |
| CreatedBy | FK→user |  |  |  | Identifier for the user that created the record. | DeleteRule=DeleteRule.Ignore |
| CreatedOn | DateTime |  |  |  | Date and time in which the record was created. |  |
| UpdatedBy | FK→user |  |  |  | Identifier for the user that updated the record. | DeleteRule=DeleteRule.Ignore |
| UpdatedOn | DateTime |  |  |  | Date and time in which the record was updated. |  |

## ServerEntity ProductPicture — Description="Entity that holds the sample images for Products."; Public=true
| 属性 | 型 | 必須 | 長さ | 既定値 | 説明 | その他 |
|---|---|---|---|---|---|---|
| Id | LongInteger |  |  |  | Unique ProductImage record identifier. | IsAutoNumber=AutoNumber.Yes |
| ProductId | FK→product | Y |  |  | Identifier of the product. | DeleteRule=DeleteRule.Delete |
| Filename | Text |  | 250 |  | Name of the image file illustrating the product. |  |
| Filetype | Text |  | 150 |  | MIME type of the image file. |  |
| File | BinaryData |  |  |  | Binary content of the image file. |  |
| IsCover | Boolean |  |  | "False" | Holds True if the image should be displayed as cover image in the gallery, and False if otherwise. |  |
| IsActive | Boolean |  |  | "True" | Holds True if record is active, and False if otherwise. |  |
| CreatedBy | FK→user |  |  |  | Identifier for the user that created the record. | DeleteRule=DeleteRule.Ignore |
| CreatedOn | DateTime |  |  |  | Date and time in which the record was created. |  |
| UpdatedBy | FK→user |  |  |  | Identifier for the user that updated the record. | DeleteRule=DeleteRule.Ignore |
| UpdatedOn | DateTime |  |  |  | Date and time in which the record was updated. |  |

## StaticEntity ProductSort — Description="Product sort"; Public=true
| 属性 | 型 | 必須 | 長さ | 既定値 | 説明 | その他 |
|---|---|---|---|---|---|---|
| Id | Integer |  |  |  |  | IsAutoNumber=AutoNumber.Yes |
| IsActive | Boolean | Y |  |  |  |  |
| Label | Text | Y | 50 |  |  |  |
| Order | Integer | Y |  |  |  |  |
| Value | Text |  | 50 |  |  |  |
- record `Stock`: Label="\"Stock\"", Order="2", IsActive="True", Value="\"{Product}.[Stock]\""
- record `CreatedOn`: Order="3", Value="\"{Product}.[CreatedOn]\"", Label="\"Created on\"", IsActive="True"
- record `Name`: IsActive="True", Value="\"{Product}.[Name]\"", Label="\"Name\"", Order="1"
