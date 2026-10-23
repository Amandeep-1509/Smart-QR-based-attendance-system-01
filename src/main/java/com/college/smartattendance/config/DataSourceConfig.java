package com.college.smartattendance.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.Socket;

/**
 * Intelligent Database Configuration:
 * 1. Checks if MySQL is actively running on the configured host & port (default localhost:3306).
 * 2. If MySQL is active: connects to MySQL database (smart_attendance_db).
 * 3. If MySQL is not running: gracefully falls back to local embedded database (H2 file storage)
 *    so the project NEVER crashes during a college viva presentation or if MySQL wasn't started yet!
 */
@Configuration
public class DataSourceConfig {

    private static final Logger logger = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${spring.datasource.mysql.url:jdbc:mysql://localhost:3306/smart_attendance_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true}")
    private String mysqlUrl;

    @Value("${spring.datasource.mysql.username:root}")
    private String mysqlUser;

    @Value("${spring.datasource.mysql.password:root}")
    private String mysqlPass;

    @Value("${app.database.force-mode:auto}")
    private String forceMode;

    @Bean
    @Primary
    public DataSource dataSource() {
        boolean useMysql = false;

        if ("mysql".equalsIgnoreCase(forceMode)) {
            useMysql = true;
        } else if ("h2".equalsIgnoreCase(forceMode)) {
            useMysql = false;
        } else {
            // Auto-detect if MySQL server is listening on port 3306
            try (Socket socket = new Socket("localhost", 3306)) {
                useMysql = true;
                logger.info(">>> MySQL service detected on localhost:3306. Connecting to MySQL database!");
            } catch (Exception e) {
                useMysql = false;
                logger.warn(">>> MySQL service not running on localhost:3306. Falling back to local embedded database so you can run the project immediately!");
            }
        }

        if (useMysql) {
            return DataSourceBuilder.create()
                    .driverClassName("com.mysql.cj.jdbc.Driver")
                    .url(mysqlUrl)
                    .username(mysqlUser)
                    .password(mysqlPass)
                    .build();
        } else {
            return DataSourceBuilder.create()
                    .driverClassName("org.h2.Driver")
                    .url("jdbc:h2:file:./data/attendance_db;DB_CLOSE_ON_EXIT=FALSE;AUTO_RECONNECT=TRUE")
                    .username("sa")
                    .password("")
                    .build();
        }
    }
}
