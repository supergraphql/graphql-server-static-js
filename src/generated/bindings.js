const { FragmentReplacements } = require('graphcool-binding/dist/src/extractFragmentReplacements');
const { GraphcoolLink } = require('graphcool-binding/dist/src/GraphcoolLink');
const { buildFragmentInfo, buildTypeLevelInfo } = require('graphcool-binding/dist/src/prepareInfo');
const { GraphQLResolveInfo, GraphQLSchema } = require('graphql');
const { GraphQLClient } = require('graphql-request');
const { SchemaCache } = require('graphql-schema-cache');
const { delegateToSchema } = require('graphql-tools');
const { sign } = require('jsonwebtoken');

// -------------------
// This should be in graphcool-binding
const schemaCache = new SchemaCache()

class BaseBinding {
  constructor({
    typeDefs,
    endpoint,
    secret,
    fragmentReplacements}) {
    
    fragmentReplacements = fragmentReplacements || {}

    const token = sign({}, secret)
    const link = new GraphcoolLink(endpoint, token)

    this.remoteSchema = schemaCache.makeExecutableSchema({
      link,
      typeDefs,
      key: endpoint,
    })

    this.fragmentReplacements = fragmentReplacements

    this.graphqlClient = new GraphQLClient(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  delegate(operation, prop, args, info) {
    if (!info) {
      info = buildTypeLevelInfo(prop, this.remoteSchema, operation)
    } else if (typeof info === 'string') {
      info = buildFragmentInfo(prop, this.remoteSchema, operation, info)
    }

    return delegateToSchema(
      this.remoteSchema,
      this.fragmentReplacements,
      operation,
      prop,
      args || {},
      {},
      info,
    )
  }

  async request(
    query,
    variables
  ) {
    return this.graphqlClient.request(query, variables)
  }
}
// -------------------

const typeDefs = `
type Post implements Node {
  id: ID!
  isPublished: Boolean!
  title: String!
  text: String!
}

type Mutation {
  createPost(data: PostCreateInput!): Post!
  updatePost(data: PostUpdateInput!, where: PostWhereUniqueInput!): Post
  deletePost(where: PostWhereUniqueInput!): Post
  upsertPost(where: PostWhereUniqueInput!, create: PostCreateInput!, update: PostUpdateInput!): Post!
  resetData: Boolean
}

interface Node {
  id: ID!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type PostConnection {
  pageInfo: PageInfo!
  edges: [PostEdge]
}

input PostCreateInput {
  isPublished: Boolean!
  title: String!
  text: String!
}

type PostEdge {
  node: Post!
  cursor: String!
}

enum PostOrderByInput {
  id_ASC
  id_DESC
  isPublished_ASC
  isPublished_DESC
  title_ASC
  title_DESC
  text_ASC
  text_DESC
}

input PostUpdateInput {
  isPublished: Boolean
  title: String
  text: String
}

input PostWhereInput {
  AND: [PostWhereInput!]
  OR: [PostWhereInput!]
  id: ID
  id_not: ID
  id_in: [ID!]
  id_not_in: [ID!]
  id_lt: ID
  id_lte: ID
  id_gt: ID
  id_gte: ID
  id_contains: ID
  id_not_contains: ID
  id_starts_with: ID
  id_not_starts_with: ID
  id_ends_with: ID
  id_not_ends_with: ID
  isPublished: Boolean
  isPublished_not: Boolean
  title: String
  title_not: String
  title_in: [String!]
  title_not_in: [String!]
  title_lt: String
  title_lte: String
  title_gt: String
  title_gte: String
  title_contains: String
  title_not_contains: String
  title_starts_with: String
  title_not_starts_with: String
  title_ends_with: String
  title_not_ends_with: String
  text: String
  text_not: String
  text_in: [String!]
  text_not_in: [String!]
  text_lt: String
  text_lte: String
  text_gt: String
  text_gte: String
  text_contains: String
  text_not_contains: String
  text_starts_with: String
  text_not_starts_with: String
  text_ends_with: String
  text_not_ends_with: String
}

input PostWhereUniqueInput {
  id: ID
}

type Query {
  posts(where: PostWhereInput, orderBy: PostOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Post]!
  post(where: PostWhereUniqueInput!): Post
  postsConnection(where: PostWhereInput, orderBy: PostOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): PostConnection!
  node(id: ID!): Node
}
`

module.exports.Binding = class Binding extends BaseBinding {
  
  constructor({ endpoint, secret, fragmentReplacements}) {
    super({ typeDefs, endpoint, secret, fragmentReplacements});

    var self = this
    this.query = {
      posts(args, info) { 
        return self.delegate('query', 'posts', args, info)
      },
      post(args, info) { 
        return self.delegate('query', 'post', args, info)
      },
      postsConnection(args, info) { 
        return self.delegate('query', 'postsConnection', args, info)
      },
      node(args, info) { 
        return self.delegate('query', 'node', args, info)
      }
    }
      
    this.mutation = {
      createPost(args, info) { 
        return self.delegate('mutation', 'createPost', args, info)
      },
      updatePost(args, info) { 
        return self.delegate('mutation', 'updatePost', args, info)
      },
      deletePost(args, info) { 
        return self.delegate('mutation', 'deletePost', args, info)
      },
      upsertPost(args, info) { 
        return self.delegate('mutation', 'upsertPost', args, info)
      },
      resetData(args, info) { 
        return self.delegate('mutation', 'resetData', args, info)
      }
    }
  }
  
  delegate(operation, field, args, info) {
    return super.delegate(operation, field, args, info)
  }
}