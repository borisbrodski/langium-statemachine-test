package com.example;

import javax.persistence.Entity;

@Entity
public class A {
    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
