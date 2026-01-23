export type TLItem =
    | {
          kind: "folder";
          id: number;
          parent_id: number;
          title: string;
          has_children?: boolean;
          URI?: string;
      }
    | {
          kind: "document";
          doc_id: number;
          parent_id: number;
          title: string;
          version_num: number;
          URI?: string;
      };
