CREATE DATABASE IF NOT EXISTS dashboard_cybersecurity;

USE dashboard_cybersecurity;

CREATE TABLE IF NOT EXISTS cves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cve_id VARCHAR(30) NOT NULL UNIQUE,
    source_identifier VARCHAR(255),
    description_en TEXT,
    description_es TEXT,
    published_at DATETIME,
    last_modified_at DATETIME,
    status VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS cve_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cve_id INT NOT NULL,
    version VARCHAR(10),
    score DECIMAL(3,1),
    severity VARCHAR(20),
    vector TEXT,
    source VARCHAR(255),
    type VARCHAR(50),
    exploitability_score DECIMAL(4,1),
    impact_score DECIMAL(4,1),

    FOREIGN KEY (cve_id)
        REFERENCES cves(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cve_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cve_id INT NOT NULL,
    vendor TEXT,
    product TEXT,
    package_name VARCHAR(255),
    collection_url TEXT,
    default_status VARCHAR(50),

    FOREIGN KEY (cve_id)
        REFERENCES cves(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cve_product_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cve_product_id INT NOT NULL,
    version TEXT,
    less_than TEXT,
    less_than_or_equal TEXT,
    version_type VARCHAR(50),
    status VARCHAR(50),

    FOREIGN KEY (cve_product_id)
        REFERENCES cve_products(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cve_weaknesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cve_id INT NOT NULL,
    weakness_code VARCHAR(50),
    source VARCHAR(255),
    type VARCHAR(50),

    FOREIGN KEY (cve_id)
        REFERENCES cves(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cve_references (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cve_id INT NOT NULL,
    url TEXT NOT NULL,
    source VARCHAR(255),
    tags JSON,

    FOREIGN KEY (cve_id)
        REFERENCES cves(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sync_ranges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    synchronized_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
