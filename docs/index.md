![join-monster](img/join_monster.png)
[![npm version](https://badge.fury.io/js/join-monster.svg)](https://badge.fury.io/js/join-monster)
# 

## What Is It?

Join Monster is a query planner between GraphQL and SQL for the Node.js [graphql-js](https://github.com/graphql/graphql-js) reference implementation.
It's a function that takes a GraphQL query and dynamically **translates GraphQL to SQL** for efficient, batched data retrieval before resolution. It fetches only the data you need - *nothing more, nothing less*.

## Why?

It solves the problem of making too many database queries, i.e. the "round-trip" problem or "N+1" problem, where the round-trips are requests for data over the TCP/IP stack between your API server and your SQL database. Think of it as an alternative to Facebook's [DataLoader](https://github.com/facebook/dataloader), but with more specificity toward SQL, making it more powerful and simpler to use with SQL.

It is **NOT** a tool for automatically creating a schema for your GraphQL from your database or vice versa. You retain the freedom and power to define your schemas how you want. Join Monster simply "compiles" a GraphQL query to a SQL query *based on the existing schemas*. It fits into existing applications and can be seamlessly removed later or used to varying degree. It is a little opinionated, but not a full ORM.


## Preview

Instead of writing the SQL yourself, you give Join Monster a bit of information about your SQL schema.
It takes care of constructing the SQL queries. Your queries can be simple like this:

```
{                           SELECT                               {
  user(id: 1) {               "user"."id",                         user: {
    idEncoded                 "user"."first_name",                   idEncoded: 'MQ==',
    fullName        ==>       "user"."last_name",        ==>         fullName: 'andrew carlson',
    email                     "user"."email_address"                 email: 'andrew@stem.is'
  }                         FROM "accounts" AS "user"              }
}                           WHERE "user"."id" = 1                }
```

Or a bit more complex:

```graphql
{
  user(id: 2) {
    fullName
    email
    posts {
      id
      body
      createdAt
      comments {
        id
        body
        author {
          id
          fullName
        }
      }
    }
  }
}
```

which becomes...

```sql
SELECT
  "user"."id" AS "id",
  "user"."email_address" AS "email_address",
  "posts"."id" AS "posts__id",
  "posts"."body" AS "posts__body",
  "posts"."created_at" AS "posts__created_at",
  "user"."first_name" AS "first_name",
  "user"."last_name" AS "last_name"
FROM accounts AS "user"
LEFT JOIN posts AS "posts" ON "user".id = "posts".author_id
WHERE "user".id = 2

SELECT
  "comments"."id" AS "id",
  "comments"."body" AS "body",
  "author"."id" AS "author__id",
  "author"."first_name" AS "author__first_name",
  "author"."last_name" AS "author__last_name",
  "comments"."post_id" AS "post_id"
FROM comments AS "comments"
LEFT JOIN accounts AS "author" ON "comments".author_id = "author".id
WHERE "comments".archived = FALSE AND "comments"."post_id" IN (2,8,12)
```

and responds with...

```javascript
{
  "user": {
    "fullName": "Yasmine Rolfson",
    "email": "Earl.Koss41@yahoo.com",
    "posts": [
      {
        "id": 2,
        "body": "Harum unde maiores est quasi totam consequuntur. Necessitatibus doloribus ut totam dolore omnis quos error eos. Rem nostrum assumenda eius veniam fugit dicta in consequuntur. Ut porro dolorem aliquid qui magnam a.",
        "createdAt": "1468236023128",
        "comments": [
          {
            "id": 6,
            "body": "The AI driver is down, program the multi-byte sensor so we can parse the SAS bandwidth!",
            "author": {
              "id": 2,
              "fullName": "Yasmine Rolfson"
            }
          },
          {
            "id": 8,
            "body": "Try to program the SMS transmitter, maybe it will synthesize the optical firewall!",
            "author": {
              "id": 3,
              "fullName": "Ole Barrows"
            }
          }
        ]
      },
      {
        "id": 8,
        "body": "Nostrum repellendus odio. Officia eaque sunt laboriosam qui molestias quod quia eius non. Aut veritatis vero aliquid suscipit deserunt id architecto saepe. Dolorem fugit corrupti vel ipsa qui qui qui delectus facere.",
        "createdAt": "1479420252175",
        "comments": [
          {
            "id": 2,
            "body": "If we navigate the bus, we can get to the USB transmitter through the bluetooth XSS alarm!",
            "author": {
              "id": 2,
              "fullName": "Yasmine Rolfson"
            }
          },
          {
            "id": 56,
            "body": "indexing the circuit won't do anything, we need to calculate the mobile TCP interface!",
            "author": {
              "id": 4,
              "fullName": "August Crist"
            }
          }
        ]
      },
      {
        "id": 12,
        "body": "Ut ipsum minima sint rerum quo cupiditate consequatur omnis asperiores. At est aut et. Id quas ducimus et. Id et natus deserunt odio consequatur.",
        "createdAt": "1478821124545",
        "comments": []
      }
    ]
  }
}
```

## Live Demo

See it in action with [this demo API](https://join-monster-demo.onrender.com/graphql?query=%257B%250A%2520%2520user%28id%253A%25202%29%2520%257B%250A%2520%2520%2520%2520fullName%250A%2520%2520%2520%2520email%250A%2520%2520%2520%2520posts%2520%257B%250A%2520%2520%2520%2520%2520%2520id%250A%2520%2520%2520%2520%2520%2520body%250A%2520%2520%2520%2520%2520%2520comments%2520%257B%250A%2520%2520%2520%2520%2520%2520%2520%2520id%250A%2520%2520%2520%2520%2520%2520%2520%2520body%250A%2520%2520%2520%2520%2520%2520%2520%2520author%2520%257B%250A%2520%2520%2520%2520%2520%2520%2520%2520%2520%2520id%250A%2520%2520%2520%2520%2520%2520%2520%2520%2520%2520fullName%250A%2520%2520%2520%2520%2520%2520%2520%2520%257D%250A%2520%2520%2520%2520%2520%2520%257D%250A%2520%2520%2520%2520%257D%250A%2520%2520%257D%250A%257D).

## Example Code

An API set up with Join Monster, both [with](https://github.com/join-monster/join-monster/tree/master/test-api/schema-paginated) and [without](https://github.com/join-monster/join-monster/tree/master/test-api/schema-basic) Relay compliance.

