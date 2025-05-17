import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { ServerManager, CreateServerArgs, CreateServerFromTemplateArgs, ExecuteToolArgs, GetServerToolsArgs, UpdateServerArgs, DeleteServerArgs } from "./serverManager.js";


// Tool definitions
// const createServerTool: Tool = {
//   name: "create-server",
//   description: "Create a new MCP server from code",
//   inputSchema: {
//     type: "object",
//     properties: {
//       code: {
//         type: "string",
//         description: "The server code",
//       },
//       language: {
//         type: "string",
//         enum: ["typescript", "javascript", "python"],
//         description: "The programming language of the server code",
//       },
//     },
//     required: ["code", "language"],
//   },
// };

const createServerFromTemplateTool: Tool = {
  name: "create-server-from-template",
  description: `Create a new MCP server from a template.
  
  以下のテンプレートコードをベースに、ユーザーの要求に合わせたサーバーを実装してください。
  言語に応じて適切なテンプレートを選択し、必要に応じて機能を追加・変更してください。
  
  TypeScriptテンプレート:
  \`\`\`typescript
  import { Server } from "@modelcontextprotocol/sdk/server/index.js";
  import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
  import { 
    CallToolRequestSchema, 
    ListToolsRequestSchema 
  } from "@modelcontextprotocol/sdk/types.js";

  const server = new Server({
    name: "dynamic-test-server",
    version: "1.0.0"
  }, {
    capabilities: {
      tools: {}
    }
  });

  // ここでツールを実装してください
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [{
        name: "echo",
        description: "Echo back a message",
        inputSchema: {
          type: "object",
          properties: {
            message: { type: "string" }
          },
          required: ["message"]
        }
      }]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "echo") {
      // TypeScriptの型を適切に扱うため、型アサーションを使用
      const message = request.params.arguments.message as string;
      // または any を使う: const message: any = request.params.arguments.message;
      
      return {
        content: [
          {
            type: "text",
            text: \`Echo: \${message}\`
          }
        ]
      };
    }
    throw new Error("Tool not found");
  });

  // Server startup
  const transport = new StdioServerTransport();
  server.connect(transport);
  \`\`\`
  
  Pythonテンプレート:
  \`\`\`python
  import asyncio
  from mcp.server import Server
  from mcp.server.stdio import stdio_server

  app = Server("dynamic-test-server")

  @app.list_tools()
  async def list_tools():
      return [
          {
              "name": "echo",
              "description": "Echo back a message",
              "inputSchema": {
                  "type": "object",
                  "properties": {
                      "message": {"type": "string"}
                  },
                  "required": ["message"]
              }
          }
      ]

  @app.call_tool()
  async def call_tool(name, arguments):
      if name == "echo":
          return [{"type": "text", "text": f"Echo: {arguments.get('message')}"}]
      raise ValueError(f"Tool not found: {name}")

  async def main():
      async with stdio_server() as streams:
          await app.run(
              streams[0],
              streams[1],
              app.create_initialization_options()
          )

  if __name__ == "__main__":
      asyncio.run(main())
  \`\`\`
  
  注意事項：
  - TypeScript実装時は、引数の型を適切に扱うために型アサーション（as string）を使用するか、
    明示的に型を宣言してください（例：const value: string = request.params.arguments.someValue）。
  - 複雑な型を扱う場合は、interface や type を定義して型安全性を確保することをお勧めします。
  
  ユーザーの要求に応じて上記のテンプレートを参考にカスタマイズしてください。その際、基本的な構造を維持しつつ、ツール名や機能を変更できます。`,
  inputSchema: {
    type: "object",
    properties: {
      language: {
        type: "string",
        enum: ["typescript", "python"],
        description: "The programming language for the template",
      },
      code: {
        type: "string",
        description:
          "カスタマイズしたサーバーコード。テンプレートを元に変更したコードを入力してください。省略した場合はデフォルトのテンプレートが使用されます。",
      },
      dependencies: {
        type: "object",
        description: "使用するライブラリとそのバージョン（例: { \"axios\": \"^1.0.0\" }）",
      },
    },
    required: ["language"],
  },
};

const executeToolTool: Tool = {
  name: "execute-tool",
  description: "Execute a tool on a server",
  inputSchema: {
    type: "object",
    properties: {
      serverId: {
        type: "string",
        description: "The ID of the server",
      },
      toolName: {
        type: "string",
        description: "The name of the tool to execute",
      },
      args: {
        type: "object",
        description: "The arguments to pass to the tool",
      },
    },
    required: ["serverId", "toolName"],
  },
};

const getServerToolsTool: Tool = {
  name: "get-server-tools",
  description: "Get the tools available on a server",
  inputSchema: {
    type: "object",
    properties: {
      serverId: {
        type: "string",
        description: "The ID of the server",
      },
    },
    required: ["serverId"],
  },
};

// const updateServerTool: Tool = {
//   name: "update-server",
//   description: `Update a server's code.まずupdate前のコードを読み、その内容からupdateの差分を考えてください。
//         その差分をもとに、update後のコードを作成してください。`,
//   inputSchema: {
//     type: "object",
//     properties: {
//       serverId: {
//         type: "string",
//         description: "The ID of the server",
//       },
//       code: {
//         type: "string",
//         description: `The new server code.
//         `,
//       },
//     },
//     required: ["serverId", "code"],
//   },
// };

const deleteServerTool: Tool = {
  name: "delete-server",
  description: "Delete a server",
  inputSchema: {
    type: "object",
    properties: {
      serverId: {
        type: "string",
        description: "The ID of the server",
      },
    },
    required: ["serverId"],
  },
};

const listServersTool: Tool = {
  name: "list-servers",
  description: "List all running servers",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

async function main() {
  try {
    console.error("Starting MCP Create Server...");
    const server = new Server(
      {
        name: "MCP Create Server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Create server manager
    const serverManager = new ServerManager();

    // Register tool handlers
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error("Received ListToolsRequest");
      return {
        tools: [
          createServerFromTemplateTool,
          executeToolTool,
          getServerToolsTool,
          deleteServerTool,
          listServersTool,
        ],
      };
    });

    server.setRequestHandler(
      CallToolRequestSchema,
      async (request: CallToolRequest) => {
        console.error("Received CallToolRequest:", request);
        try {
          if (!request.params.arguments) {
            throw new Error("No arguments provided");
          }

          switch (request.params.name) {
            case "create-server": {
              const args = request.params
                .arguments as unknown as CreateServerArgs;
              if (!args.code || !args.language) {
                throw new Error(
                  "Missing required arguments: code and language"
                );
              }

              const serverId = await serverManager.createServer(
                args.code,
                args.language
              );

              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({ serverId }),
                  },
                ],
              };
            }

            case "create-server-from-template": {
              const args = request.params
                .arguments as unknown as CreateServerFromTemplateArgs;
              if (!args.language) {
                throw new Error("Missing required argument: language");
              }

              // LLMから提供されたカスタムコードがあればそれを使用し、なければデフォルトのテンプレートを使用
              let serverCode = args.code;

              // コードが提供されていない場合はデフォルトテンプレートを使用
              if (!serverCode) {
                // 既存のテンプレート選択ロジック
                switch (args.language) {
                  case "typescript":
                    serverCode = `/* TypeScriptテンプレート */`;
                    break;
                  case "python":
                    serverCode = `# Pythonテンプレート`;
                    break;
                  default:
                    throw new Error(
                      `Unsupported template language: ${args.language}`
                    );
                }
              }

              const result = await serverManager.createServer(
                serverCode,
                args.language,
                args.dependencies
              );

              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({
                      serverId: result,
                      message: args.code
                        ? `Created server from custom code in ${args.language}`
                        : `Created server from ${args.language} template`,
                    }),
                  },
                ],
              };
            }

            case "execute-tool": {
              const args = request.params
                .arguments as unknown as ExecuteToolArgs;
              if (!args.serverId || !args.toolName) {
                throw new Error(
                  "Missing required arguments: serverId and toolName"
                );
              }

              const result = await serverManager.executeToolOnServer(
                args.serverId,
                args.toolName,
                args.args || {}
              );

              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(result),
                  },
                ],
              };
            }

            case "get-server-tools": {
              const args = request.params
                .arguments as unknown as GetServerToolsArgs;
              if (!args.serverId) {
                throw new Error("Missing required argument: serverId");
              }

              const tools = await serverManager.getServerTools(args.serverId);

              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({ tools }),
                  },
                ],
              };
            }

            case "update-server": {
              const args = request.params
                .arguments as unknown as UpdateServerArgs;
              if (!args.serverId || !args.code) {
                throw new Error(
                  "Missing required arguments: serverId and code"
                );
              }

              const result = await serverManager.updateServer(
                args.serverId,
                args.code
              );

              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(result),
                  },
                ],
              };
            }

            case "delete-server": {
              const args = request.params
                .arguments as unknown as DeleteServerArgs;
              if (!args.serverId) {
                throw new Error("Missing required argument: serverId");
              }

              const result = await serverManager.deleteServer(args.serverId);

              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(result),
                  },
                ],
              };
            }

            case "list-servers": {
              const servers = serverManager.listServers();

              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({ servers }),
                  },
                ],
              };
            }

            default:
              throw new Error(`Unknown tool: ${request.params.name}`);
          }
        } catch (error) {
          console.error("Error executing tool:", error);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: error instanceof Error ? error.message : String(error),
                }),
              },
            ],
          };
        }
      }
    );

    // Set up transport and connect
    const transport = new StdioServerTransport();
    console.error("Connecting server to transport...");
    await server.connect(transport);

    console.error("MCP Create Server running on stdio");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to start server: ${errorMessage}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
