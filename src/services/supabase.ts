import { createClient } from '@supabase/supabase-js';

type QueryResult = {
  data: any;
  error: Error | null;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

const createMissingEnvError = () =>
  new Error(
    'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
  );

class DisabledQuery implements PromiseLike<QueryResult> {
  select(_columns?: string) {
    return this;
  }

  insert(_payload: any) {
    return this;
  }

  update(_payload: any) {
    return this;
  }

  delete() {
    return this;
  }

  upsert(_payload: any) {
    return this;
  }

  eq(_column: string, _value: any) {
    return this;
  }

  neq(_column: string, _value: any) {
    return this;
  }

  not(_column: string, _operator: string, _value: any) {
    return this;
  }

  order(_column: string, _options?: { ascending?: boolean }) {
    return this;
  }

  limit(_count: number) {
    return this;
  }

  single() {
    return this;
  }

  maybeSingle() {
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve({
      data: null,
      error: createMissingEnvError(),
    }).then(onfulfilled, onrejected);
  }
}

const createDisabledSupabaseClient = () => ({
  from(_table: string) {
    return new DisabledQuery();
  },
  storage: {
    from(_bucket: string) {
      return {
        async upload(
          _path: string,
          _file: File,
          _options?: Record<string, unknown>,
        ) {
          return {
            data: null,
            error: createMissingEnvError(),
          };
        },
        getPublicUrl(_path: string) {
          return {
            data: {
              publicUrl: '',
            },
          };
        },
      };
    },
  },
});

if (!hasSupabaseEnv) {
  console.warn(
    'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para habilitar o banco real.',
  );
}

export const supabase: any = hasSupabaseEnv
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createDisabledSupabaseClient();
