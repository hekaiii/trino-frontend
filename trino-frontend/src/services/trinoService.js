import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const trinoApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getCatalogs = async () => {
  // 返回mock数据 - 模拟多种数据源
  return [
    'information_schema', 
    'system', 
    'hive', 
    'mysql', 
    'postgresql', 
    'oracle', 
    'sqlserver', 
    'mongodb', 
    'elasticsearch',
    'redis',
    'kafka',
    'hdfs',
    's3'
  ];
};

export const getSchemas = async (catalogName) => {
  // 返回mock数据 - 丰富的schema数据
  const mockSchemas = {
    'information_schema': ['information_schema', 'columns', 'tables', 'views'],
    'system': ['runtime', 'metadata', 'queries', 'nodes'],
    'hive': ['default', 'warehouse', 'analytics', 'etl', 'staging', 'mart'],
    'mysql': ['ecommerce', 'user_management', 'order_system', 'payment', 'inventory', 'reporting'],
    'postgresql': ['public', 'sales', 'marketing', 'finance', 'hr', 'operations'],
    'oracle': ['hr', 'finance', 'supply_chain', 'manufacturing', 'quality', 'admin'],
    'sqlserver': ['master', 'production', 'staging', 'development', 'backup', 'monitoring'],
    'mongodb': ['user_profiles', 'product_catalog', 'logs', 'sessions', 'analytics', 'cache'],
    'elasticsearch': ['logs', 'metrics', 'events', 'search_index', 'alerts', 'audit'],
    'redis': ['cache', 'sessions', 'queue', 'pub_sub', 'counters', 'locks'],
    'kafka': ['default', 'streaming', 'events', 'analytics', 'logs', 'realtime'],
    'hdfs': ['warehouse', 'raw_data', 'processed', 'backup', 'staging', 'archive'],
    's3': ['data_lake', 'backups', 'logs', 'analytics', 'ml_datasets', 'documents']
  };
  return mockSchemas[catalogName] || ['default', 'information_schema'];
};

export const getTables = async (catalogName, schemaName) => {
  // 返回mock数据 - 丰富的表数据
  const mockTables = {
    // Hive数据源
    'hive.default': ['users', 'orders', 'products', 'categories', 'reviews', 'wishlist'],
    'hive.warehouse': ['inventory', 'suppliers', 'purchase_orders', 'stock_movements', 'locations', 'warehouses'],
    'hive.analytics': ['user_behavior', 'sales_metrics', 'conversion_funnel', 'cohort_analysis', 'revenue_trends', 'customer_lifetime_value'],
    'hive.etl': ['staging_users', 'staging_orders', 'data_quality_checks', 'transformation_logs', 'error_records', 'batch_jobs'],
    'hive.staging': ['raw_clickstream', 'raw_transactions', 'raw_user_events', 'raw_product_updates', 'raw_inventory', 'raw_logs'],
    'hive.mart': ['dim_users', 'dim_products', 'fact_sales', 'fact_inventory', 'dim_time', 'dim_geography'],

    // MySQL数据源
    'mysql.ecommerce': ['customers', 'orders', 'order_items', 'products', 'product_variants', 'shopping_cart', 'discounts', 'coupons'],
    'mysql.user_management': ['users', 'roles', 'permissions', 'user_roles', 'user_sessions', 'user_profiles', 'authentication_logs'],
    'mysql.order_system': ['orders', 'order_status', 'shipping_addresses', 'billing_addresses', 'order_tracking', 'returns', 'refunds'],
    'mysql.payment': ['payments', 'payment_methods', 'transactions', 'payment_gateways', 'billing_cycles', 'invoices', 'receipts'],
    'mysql.inventory': ['products', 'stock_levels', 'suppliers', 'purchase_orders', 'stock_movements', 'warehouses', 'locations'],
    'mysql.reporting': ['daily_sales', 'monthly_revenue', 'customer_analytics', 'product_performance', 'inventory_reports', 'financial_summary'],

    // PostgreSQL数据源
    'postgresql.public': ['users', 'posts', 'comments', 'likes', 'follows', 'notifications', 'media_files'],
    'postgresql.sales': ['leads', 'opportunities', 'accounts', 'contacts', 'deals', 'sales_pipeline', 'quotations', 'contracts'],
    'postgresql.marketing': ['campaigns', 'email_lists', 'subscribers', 'campaign_metrics', 'landing_pages', 'ab_tests', 'segments'],
    'postgresql.finance': ['accounts', 'transactions', 'budgets', 'expenses', 'revenue', 'tax_records', 'financial_reports'],
    'postgresql.hr': ['employees', 'departments', 'positions', 'salaries', 'benefits', 'performance_reviews', 'attendance'],
    'postgresql.operations': ['projects', 'tasks', 'resources', 'schedules', 'equipment', 'maintenance', 'incidents'],

    // Oracle数据源
    'oracle.hr': ['employees', 'departments', 'jobs', 'job_history', 'locations', 'countries', 'regions'],
    'oracle.finance': ['gl_accounts', 'journal_entries', 'budgets', 'cost_centers', 'financial_periods', 'exchange_rates'],
    'oracle.supply_chain': ['suppliers', 'purchase_orders', 'receipts', 'invoices', 'inventory', 'demand_forecast'],
    'oracle.manufacturing': ['work_orders', 'bill_of_materials', 'routing', 'work_centers', 'production_schedules', 'quality_checks'],
    'oracle.quality': ['inspections', 'test_results', 'quality_plans', 'non_conformances', 'corrective_actions', 'audits'],
    'oracle.admin': ['users', 'roles', 'privileges', 'audit_trail', 'system_parameters', 'backup_logs'],

    // SQL Server数据源
    'sqlserver.master': ['databases', 'logins', 'server_roles', 'linked_servers', 'system_configurations'],
    'sqlserver.production': ['customers', 'orders', 'products', 'inventory', 'transactions', 'audit_logs'],
    'sqlserver.staging': ['temp_customers', 'temp_orders', 'temp_products', 'validation_results', 'staging_logs'],
    'sqlserver.development': ['test_customers', 'test_orders', 'test_data', 'dev_logs', 'feature_flags'],
    'sqlserver.backup': ['backup_history', 'restore_history', 'backup_devices', 'backup_sets'],
    'sqlserver.monitoring': ['performance_counters', 'wait_stats', 'query_stats', 'index_usage', 'system_health'],

    // MongoDB数据源
    'mongodb.user_profiles': ['users', 'profiles', 'preferences', 'social_connections', 'activity_logs', 'achievements'],
    'mongodb.product_catalog': ['products', 'categories', 'brands', 'specifications', 'reviews', 'recommendations'],
    'mongodb.logs': ['application_logs', 'error_logs', 'access_logs', 'security_logs', 'performance_logs', 'audit_logs'],
    'mongodb.sessions': ['user_sessions', 'shopping_sessions', 'browsing_history', 'search_history', 'cart_sessions'],
    'mongodb.analytics': ['page_views', 'click_events', 'conversion_events', 'user_journeys', 'cohort_data', 'funnel_data'],
    'mongodb.cache': ['cached_queries', 'cached_pages', 'cached_objects', 'cache_statistics', 'cache_policies'],

    // Elasticsearch数据源
    'elasticsearch.logs': ['application_logs', 'system_logs', 'security_logs', 'access_logs', 'error_logs', 'performance_logs'],
    'elasticsearch.metrics': ['cpu_metrics', 'memory_metrics', 'disk_metrics', 'network_metrics', 'application_metrics'],
    'elasticsearch.events': ['user_events', 'system_events', 'business_events', 'security_events', 'operational_events'],
    'elasticsearch.search_index': ['product_search', 'content_search', 'user_search', 'document_search', 'knowledge_base'],
    'elasticsearch.alerts': ['system_alerts', 'security_alerts', 'performance_alerts', 'business_alerts', 'operational_alerts'],
    'elasticsearch.audit': ['user_actions', 'system_changes', 'data_access', 'configuration_changes', 'security_events'],

    // Redis数据源
    'redis.cache': ['page_cache', 'query_cache', 'object_cache', 'session_cache', 'api_cache', 'fragment_cache'],
    'redis.sessions': ['user_sessions', 'admin_sessions', 'guest_sessions', 'api_sessions', 'mobile_sessions'],
    'redis.queue': ['email_queue', 'notification_queue', 'processing_queue', 'backup_queue', 'sync_queue'],
    'redis.pub_sub': ['notifications', 'real_time_updates', 'chat_messages', 'system_broadcasts', 'alerts'],
    'redis.counters': ['page_views', 'user_actions', 'api_calls', 'error_counts', 'performance_metrics'],
    'redis.locks': ['resource_locks', 'process_locks', 'distributed_locks', 'mutex_locks', 'semaphores'],

    // Kafka数据源
    'kafka.default': ['user_events', 'order_events', 'product_updates', 'inventory_changes', 'system_logs', 'error_events'],
    'kafka.streaming': ['clickstream', 'user_behavior', 'real_time_analytics', 'live_metrics', 'sensor_data', 'iot_events'],
    'kafka.events': ['purchase_events', 'login_events', 'logout_events', 'registration_events', 'payment_events', 'shipping_events'],
    'kafka.analytics': ['page_views', 'conversion_events', 'funnel_data', 'cohort_events', 'attribution_data', 'campaign_events'],
    'kafka.logs': ['application_logs', 'access_logs', 'error_logs', 'audit_logs', 'security_logs', 'performance_logs'],
    'kafka.realtime': ['stock_prices', 'live_chat', 'notifications', 'alerts', 'status_updates', 'live_feeds'],

    // HDFS数据源
    'hdfs.warehouse': ['customer_data', 'transaction_history', 'product_catalog', 'inventory_snapshots', 'sales_records', 'marketing_data'],
    'hdfs.raw_data': ['web_logs', 'application_logs', 'sensor_readings', 'social_media_feeds', 'email_campaigns', 'survey_responses'],
    'hdfs.processed': ['aggregated_sales', 'customer_segments', 'product_recommendations', 'churn_predictions', 'fraud_scores', 'trend_analysis'],
    'hdfs.backup': ['daily_backups', 'weekly_snapshots', 'monthly_archives', 'disaster_recovery', 'historical_data', 'compliance_records'],
    'hdfs.staging': ['etl_staging', 'data_validation', 'cleansing_results', 'transformation_temp', 'load_staging', 'quality_checks'],
    'hdfs.archive': ['legacy_systems', 'historical_transactions', 'old_customer_data', 'archived_campaigns', 'regulatory_data', 'audit_trail'],

    // S3数据源
    's3.data_lake': ['customer_360', 'product_analytics', 'sales_insights', 'marketing_attribution', 'supply_chain_data', 'financial_reports'],
    's3.backups': ['database_backups', 'file_system_backups', 'application_backups', 'configuration_backups', 'log_backups', 'disaster_recovery'],
    's3.logs': ['cloudtrail_logs', 'vpc_flow_logs', 'elb_access_logs', 'cloudfront_logs', 'waf_logs', 'application_logs'],
    's3.analytics': ['clickstream_data', 'user_journey_data', 'conversion_funnels', 'cohort_analysis', 'attribution_models', 'predictive_models'],
    's3.ml_datasets': ['training_data', 'feature_stores', 'model_artifacts', 'prediction_results', 'validation_sets', 'test_datasets'],
    's3.documents': ['contracts', 'invoices', 'reports', 'presentations', 'specifications', 'compliance_docs'],

    // System schemas
    'system.runtime': ['nodes', 'queries', 'tasks', 'memory_pools', 'transactions'],
    'system.metadata': ['catalogs', 'schemas', 'tables', 'columns', 'functions'],
    'system.queries': ['completed_queries', 'failed_queries', 'running_queries', 'query_history'],
    'system.nodes': ['node_status', 'node_memory', 'node_cpu', 'coordinator', 'workers'],

    // Information schema
    'information_schema.information_schema': ['tables', 'columns', 'views', 'routines', 'parameters'],
    'information_schema.columns': ['table_columns', 'view_columns', 'routine_columns'],
    'information_schema.tables': ['base_tables', 'views', 'system_tables'],
    'information_schema.views': ['table_views', 'materialized_views', 'system_views']
  };
  
  const key = `${catalogName}.${schemaName}`;
  return mockTables[key] || ['default_table1', 'default_table2', 'default_table3'];
};

export const getTableDetails = async (catalogName, schemaName, tableName) => {
  // 返回mock数据
  const mockTableDetails = {
    'users': {
      columns: [
        { name: 'id', type: 'bigint', comment: '用户ID' },
        { name: 'username', type: 'varchar(50)', comment: '用户名' },
        { name: 'email', type: 'varchar(100)', comment: '邮箱' },
        { name: 'created_at', type: 'timestamp', comment: '创建时间' }
      ],
      ddl: `CREATE TABLE ${catalogName}.${schemaName}.${tableName} (
  id bigint,
  username varchar(50),
  email varchar(100),
  created_at timestamp
);`
    },
    'orders': {
      columns: [
        { name: 'order_id', type: 'bigint', comment: '订单ID' },
        { name: 'user_id', type: 'bigint', comment: '用户ID' },
        { name: 'total_amount', type: 'decimal(10,2)', comment: '总金额' },
        { name: 'status', type: 'varchar(20)', comment: '订单状态' },
        { name: 'order_date', type: 'timestamp', comment: '下单时间' }
      ],
      ddl: `CREATE TABLE ${catalogName}.${schemaName}.${tableName} (
  order_id bigint,
  user_id bigint,
  total_amount decimal(10,2),
  status varchar(20),
  order_date timestamp
);`
    },
    'products': {
      columns: [
        { name: 'product_id', type: 'bigint', comment: '产品ID' },
        { name: 'name', type: 'varchar(100)', comment: '产品名称' },
        { name: 'price', type: 'decimal(8,2)', comment: '价格' },
        { name: 'category', type: 'varchar(50)', comment: '分类' },
        { name: 'description', type: 'text', comment: '描述' }
      ],
      ddl: `CREATE TABLE ${catalogName}.${schemaName}.${tableName} (
  product_id bigint,
  name varchar(100),
  price decimal(8,2),
  category varchar(50),
  description text
);`
    }
  };
  
  return mockTableDetails[tableName] || {
    columns: [
      { name: 'id', type: 'bigint', comment: '主键' },
      { name: 'name', type: 'varchar', comment: '名称' },
      { name: 'created_at', type: 'timestamp', comment: '创建时间' }
    ],
    ddl: `CREATE TABLE ${catalogName}.${schemaName}.${tableName} (
  id bigint,
  name varchar,
  created_at timestamp
);`
  };
};

export const executeQuery = async (sql) => {
  try {
    const response = await trinoApi.post('/api/query', { sql });
    return response.data;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

export default trinoApi;